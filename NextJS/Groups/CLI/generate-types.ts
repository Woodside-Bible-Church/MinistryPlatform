#!/usr/bin/env tsx

// Load environment variables in Next.js order of precedence
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment files in Next.js order of precedence
const envFiles = [
  '.env.local',
  '.env.development', 
  '.env',
];

envFiles.forEach(file => {
  const envPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
});

import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import { TableMetadata, ColumnMetadata, ParameterDataType } from "@/providers/MinistryPlatform/Interfaces/mpProviderInterfaces";

interface CLIOptions {
  outputDir: string;
  search?: string;
  help?: boolean;
  detailed?: boolean;
  sampleSize?: number;
  zodSchemas?: boolean;
}

function parseArguments(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    outputDir: "./generated-types",
    sampleSize: 5,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case "-o":
      case "--output":
        options.outputDir = args[++i];
        break;
      case "-s":
      case "--search":
        options.search = args[++i];
        break;
      case "-d":
      case "--detailed":
        options.detailed = true;
        break;
      case "--sample-size":
        options.sampleSize = parseInt(args[++i], 10);
        break;
      case "-z":
      case "--zod":
        options.zodSchemas = true;
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: tsx CLI/generate-types.ts [options]

Prerequisites:
  Ensure your environment configuration contains the required Ministry Platform settings:
  - MINISTRY_PLATFORM_BASE_URL
  - MINISTRY_PLATFORM_CLIENT_ID  
  - MINISTRY_PLATFORM_CLIENT_SECRET
  
  Supports .env.local, .env.development, and .env files (loaded in that order)

Options:
  -o, --output <dir>     Output directory for generated types (default: ./generated-types)
  -s, --search <term>    Optional search term to filter tables
  -d, --detailed         Generate detailed types by sampling records (slower)
  --sample-size <num>    Number of records to sample for detailed mode (default: 5)
  -z, --zod              Generate Zod schemas for runtime validation
  -h, --help             Show this help message

Examples:
  tsx CLI/generate-types.ts -o ./src/types/generated -s "Contact"
  tsx CLI/generate-types.ts -d --sample-size 10 -o ./types
  tsx CLI/generate-types.ts --zod -o ./types # Include Zod schemas
`);
}

function sanitizeTypeName(name: string): string {
  // Convert table name to PascalCase and remove special characters
  return name
    .split(/[-_\s\/]+/) // Added slash to handle field names like "SSN/EIN"
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "");
}

function mapDataTypeToTypeScript(dataType: ParameterDataType, isRequired: boolean, size?: number): string {
  const baseType = (() => {
    switch (dataType) {
      case "String":
      case "Text":
      case "LargeString":
        return size && size > 0 ? `string /* max ${size} chars */` : "string";
      case "Email":
        return size && size > 0 ? `string /* email, max ${size} chars */` : "string /* email */";
      case "Phone":
        return "string /* phone number */";
      case "Url":
        return size && size > 0 ? `string /* URL, max ${size} chars */` : "string /* URL */";
      case "Integer16":
        return "number /* 16-bit integer */";
      case "Integer32":
        return "number /* 32-bit integer */";
      case "Integer64":
        return "number /* 64-bit integer */";
      case "Decimal":
      case "Real":
        return "number /* decimal */";
      case "Money":
        return "number /* currency amount */";
      case "Counter":
        return "number /* auto-increment */";
      case "Boolean":
        return "boolean";
      case "Date":
        return "string /* ISO date (YYYY-MM-DD) */";
      case "Time":
        return "string /* ISO time (HH:MM:SS) */";
      case "DateTime":
      case "Timestamp":
        return "string /* ISO datetime */";
      case "Guid":
        return "string /* GUID/UUID */";
      case "Binary":
      case "Image":
        return "Blob | string /* binary data */";
      case "Xml":
        return "string /* XML content */";
      case "Password":
        return "string /* password hash */";
      case "SecretKey":
        return "string /* secret key */";
      case "Separator":
        return "never"; // Separators are not data fields
      default:
        return "unknown";
    }
  })();
  
  return isRequired ? baseType : `${baseType} | null`;
}

function mapDataTypeToZod(col: ColumnMetadata): string {
  let zodType = "";
  
  switch (col.DataType) {
    case "String":
    case "Text":
    case "LargeString":
      zodType = "z.string()";
      if (col.Size > 0) {
        zodType += `.max(${col.Size})`;
      }
      break;
    case "Email":
      zodType = "z.string().email()";
      if (col.Size > 0) {
        zodType += `.max(${col.Size})`;
      }
      break;
    case "Phone":
      zodType = "z.string()"; // Could add phone validation regex
      break;
    case "Url":
      zodType = "z.string().url()";
      if (col.Size > 0) {
        zodType += `.max(${col.Size})`;
      }
      break;
    case "Integer16":
    case "Integer32":
    case "Integer64":
    case "Counter":
      zodType = "z.number().int()";
      break;
    case "Decimal":
    case "Real":
    case "Money":
      zodType = "z.number()";
      break;
    case "Boolean":
      zodType = "z.boolean()";
      break;
    case "Date":
      zodType = "z.string().datetime()"; // or z.date() for Date objects
      break;
    case "Time":
      zodType = "z.string()"; // Could add time format validation
      break;
    case "DateTime":
    case "Timestamp":
      zodType = "z.string().datetime()";
      break;
    case "Guid":
      zodType = "z.string().uuid()";
      break;
    default:
      zodType = "z.unknown()";
  }
  
  if (!col.IsRequired) {
    zodType += ".nullable()";
  }
  
  return zodType;
}

function generateZodSchema(table: TableMetadata): string {
  const typeName = sanitizeTypeName(table.Name);
  const schemaName = `${typeName}Schema`;
  
  if (!table.Columns || table.Columns.length === 0) {
    return `export const ${schemaName} = z.object({});`;
  }
  
  const fields = table.Columns
    .filter(col => col.DataType !== "Separator")
    .map(col => {
      const zodType = mapDataTypeToZod(col);
      return `  ${col.Name}: ${zodType},`;
    });
  
  return `import { z } from 'zod';

export const ${schemaName} = z.object({
${fields.join('\n')}
});

export type ${typeName}Input = z.infer<typeof ${schemaName}>;
`;
}

function inferTypeFromValue(value: unknown): string {
  if (value === null || value === undefined) return "unknown";
  
  const type = typeof value;
  switch (type) {
    case "string":
      // Check for common patterns
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value as string)) {
        return "string"; // ISO date string
      }
      return "string";
    case "number":
      return Number.isInteger(value) ? "number" : "number";
    case "boolean":
      return "boolean";
    case "object":
      if (Array.isArray(value)) return "unknown[]";
      return "Record<string, unknown>";
    default:
      return "unknown";
  }
}

function generateDetailedTypeDefinition(
  table: TableMetadata, 
  sampleRecords?: Record<string, unknown>[]
): string {
  const typeName = sanitizeTypeName(table.Name);
  const interfaceName = `${typeName}Record`;
  
  let fieldsDefinition = "";
  
  // Use column metadata if available, otherwise fall back to sample records
  if (table.Columns && table.Columns.length > 0) {
    // Generate fields from column metadata
    const fields = table.Columns
      .filter(col => col.DataType !== "Separator") // Skip separator fields
      .map(col => {
        const fieldType = mapDataTypeToTypeScript(col.DataType, col.IsRequired, col.Size > 0 ? col.Size : undefined);
        const optionalMarker = col.IsRequired ? "" : "?";
        const commentParts = [];
        
        if (col.IsPrimaryKey) commentParts.push("Primary Key");
        if (col.IsForeignKey && col.ReferencedTable) {
          commentParts.push(`Foreign Key -> ${col.ReferencedTable}.${col.ReferencedColumn}`);
        }
        if (col.IsReadOnly) commentParts.push("Read Only");
        if (col.IsComputed) commentParts.push("Computed");
        if (col.HasDefault) commentParts.push("Has Default");
        
        // Add JSDoc comment for additional constraints
        let jsDocComment = "";
        if (col.Size > 0 && ["String", "Text", "Email", "Url"].includes(col.DataType)) {
          jsDocComment = `\n  /**\n   * Max length: ${col.Size} characters\n   */`;
        }
        
        const inlineComment = commentParts.length > 0 ? ` // ${commentParts.join(", ")}` : "";
        
        return `${jsDocComment}\n  ${col.Name}${optionalMarker}: ${fieldType};${inlineComment}`;
      });
    
    fieldsDefinition = fields.join("\n");
  } else if (sampleRecords && sampleRecords.length > 0) {
    // Fall back to sample record inference
    const fieldMap = new Map<string, Set<string>>();
    
    sampleRecords.forEach(record => {
      Object.entries(record).forEach(([key, value]) => {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, new Set());
        }
        fieldMap.get(key)!.add(inferTypeFromValue(value));
      });
    });
    
    const fields = Array.from(fieldMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fieldName, types]) => {
        const typeUnion = Array.from(types).join(" | ");
        const isOptional = sampleRecords.some(record => 
          record[fieldName] === null || record[fieldName] === undefined
        );
        return `  ${fieldName}${isOptional ? "?" : ""}: ${typeUnion};`;
      });
    
    fieldsDefinition = fields.join("\n");
  } else {
    // Basic fallback
    fieldsDefinition = `  ${table.Name}_ID?: number; // Primary key (assuming standard naming convention)
  [key: string]: unknown; // Allow for additional fields`;
  }
  
  const permissions = table.SpecialPermissions ? `Special Permissions: ${table.SpecialPermissions}` : "";
  const accessLevel = `Access Level: ${table.AccessLevel}`;
  
  return `/**
 * Interface for ${table.Name}
 * Table: ${table.Name}
 * ${accessLevel}
 * ${permissions}
 * ${sampleRecords ? `Generated from ${sampleRecords.length} sample records` : "Generated from column metadata"}
 */
export interface ${interfaceName} {
${fieldsDefinition}
}

export type ${typeName} = ${interfaceName};
`;
}

function generateTypeDefinition(table: TableMetadata): string {
  return generateDetailedTypeDefinition(table);
}

function generateIndexFile(tables: TableMetadata[], generatedFiles: string[]): string {
  // Filter tables to only include those that were successfully generated
  const validTables = tables.filter(table => 
    table.Name && 
    typeof table.Name === 'string' &&
    generatedFiles.includes(`${sanitizeTypeName(table.Name)}.ts`)
  );

  const exports = validTables
    .map(table => {
      const typeName = sanitizeTypeName(table.Name);
      return `export * from "./${typeName}";`;
    })
    .join("\n");

  return `// Auto-generated index file
// Generated on: ${new Date().toISOString()}
// Successfully generated ${validTables.length} of ${tables.length} tables

${exports}
`;
}

function validateEnvironment() {
  const requiredEnvVars = [
    'MINISTRY_PLATFORM_BASE_URL',
    'MINISTRY_PLATFORM_CLIENT_ID',
    'MINISTRY_PLATFORM_CLIENT_SECRET'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach(envVar => console.error(`  - ${envVar}`));
    console.error("\nPlease ensure your environment variables are set in .env.local, .env.development, .env, or your system environment.");
    console.error("You can create a .env.local file based on .env.example if it doesn't exist.");
    process.exit(1);
  }
}

async function main() {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    return;
  }

  // Validate environment before proceeding
  validateEnvironment();

  console.log("🚀 Generating TypeScript types from Ministry Platform schema...\n");

  try {
    // Initialize MP Helper
    const mpHelper = new MPHelper();
    
    // Fetch table metadata
    console.log("📡 Fetching table metadata from Ministry Platform...");
    const tables = await mpHelper.getTables(options.search);
    
    console.log(`✅ Found ${tables.length} tables`);
    
    if (options.search) {
      console.log(`🔍 Filtered by search term: "${options.search}"`);
    }

    // Debug: Check for tables with invalid names
    const invalidTables = tables.filter(table => !table.Name || typeof table.Name !== 'string');
    if (invalidTables.length > 0) {
      console.log(`⚠ Found ${invalidTables.length} tables with invalid names (will be skipped)`);
    }

    // Create output directory
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${options.outputDir}`);
    }

    // Generate type files
    console.log("\n🔧 Generating type definitions...");
    
    if (options.detailed) {
      console.log(`  📊 Using detailed mode - sampling ${options.sampleSize} records per table`);
    }
    
    const generatedFiles: string[] = [];
    
    for (const table of tables) {
      // Skip tables with invalid names
      if (!table.Name || typeof table.Name !== 'string') {
        console.log(`  ⚠ Skipping table with invalid name:`, table);
        continue;
      }
      
      const typeName = sanitizeTypeName(table.Name);
      const fileName = `${typeName}.ts`;
      const filePath = path.join(options.outputDir, fileName);
      
      try {
        let typeDefinition: string;
        
        if (options.detailed && (!table.Columns || table.Columns.length === 0)) {
          try {
            // Only fetch sample records if we don't have column metadata
            const sampleRecords = await mpHelper.getTableRecords<Record<string, unknown>>({
              table: table.Name,
              top: options.sampleSize,
              orderBy: `${table.Name}_ID DESC` // Get most recent records
            });
            
            typeDefinition = generateDetailedTypeDefinition(table, sampleRecords);
            console.log(`  ✓ ${fileName} (${table.Name}) [${sampleRecords.length} samples]`);
          } catch (error) {
            console.log(`  ⚠ ${fileName} (${table.Name}) [error sampling - using column metadata]`);
            typeDefinition = generateTypeDefinition(table);
          }
        } else {
          typeDefinition = generateTypeDefinition(table);
          const sourceInfo = table.Columns && table.Columns.length > 0 ? 
            `[${table.Columns.length} columns]` : 
            "[basic]";
          console.log(`  ✓ ${fileName} (${table.Name}) ${sourceInfo}`);
        }
        
        fs.writeFileSync(filePath, typeDefinition);
        generatedFiles.push(fileName);
        
        // Generate Zod schema if requested
        if (options.zodSchemas && table.Columns && table.Columns.length > 0) {
          const zodFileName = `${typeName}Schema.ts`;
          const zodFilePath = path.join(options.outputDir, zodFileName);
          const zodSchema = generateZodSchema(table);
          fs.writeFileSync(zodFilePath, zodSchema);
          generatedFiles.push(zodFileName);
        }
      } catch (error) {
        console.log(`  ❌ Failed to generate ${fileName}: ${error instanceof Error ? error.message : error}`);
        // Continue with other tables
      }
    }

    // Generate index file
    const indexPath = path.join(options.outputDir, "index.ts");
    const indexContent = generateIndexFile(tables, generatedFiles);
    fs.writeFileSync(indexPath, indexContent);
    
    console.log(`  ✓ index.ts (barrel export)`);

    console.log(`\n🎉 Successfully generated ${generatedFiles.length} type files in ${options.outputDir}`);
    
    if (generatedFiles.length !== tables.length) {
      console.log(`ℹ ${tables.length - generatedFiles.length} tables were skipped due to errors or invalid names`);
    }
    
    // Show usage instructions
    console.log(`\n📖 Usage:
    import { Contacts, Households } from "${options.outputDir}";
    
    // Or import record interfaces
    import { ContactsRecord, HouseholdsRecord } from "${options.outputDir}";
    
    // Or import all types
    import * as MPTypes from "${options.outputDir}";${options.zodSchemas ? `
    
    // With Zod schemas for validation:
    import { ContactsSchema } from "${options.outputDir}";
    const validatedContact = ContactsSchema.parse(contactData);` : ""}
`);

  } catch (error) {
    console.error("❌ Error generating types:");
    
    if (error instanceof Error) {
      if (error.message.includes('undefined/oauth/connect/token')) {
        console.error("Environment configuration issue - MINISTRY_PLATFORM_BASE_URL is not set properly.");
        console.error("Please check your .env file and ensure MINISTRY_PLATFORM_BASE_URL is defined.");
      } else if (error.message.includes('Failed to get client credentials token')) {
        console.error("Authentication failed - please check your Ministry Platform credentials.");
        console.error("Verify MINISTRY_PLATFORM_CLIENT_ID and MINISTRY_PLATFORM_CLIENT_SECRET in your .env file.");
      } else {
        console.error(error.message);
      }
    } else {
      console.error(error);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
