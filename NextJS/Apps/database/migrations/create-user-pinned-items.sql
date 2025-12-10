-- Create User_Pinned_Items table for homepage shortcuts
-- This allows users to pin any item (projects, events, etc.) to their homepage

CREATE TABLE IF NOT EXISTS User_Pinned_Items (
  User_Pinned_Item_ID SERIAL PRIMARY KEY,
  Contact_ID INT NOT NULL,
  Item_Type VARCHAR(50) NOT NULL, -- 'budget-project', 'event', 'custom'
  Item_ID VARCHAR(255) NOT NULL,  -- Project slug, event ID, etc.
  Item_Data JSONB NOT NULL,        -- Display metadata (title, subtitle, stats, etc.)
  Route VARCHAR(500) NOT NULL,     -- Navigation URL
  Sort_Order INT DEFAULT 0,
  Created_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_item UNIQUE(Contact_ID, Item_Type, Item_ID)
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_user_pinned_items_contact_id ON User_Pinned_Items(Contact_ID);

-- Create index for sort order
CREATE INDEX IF NOT EXISTS idx_user_pinned_items_sort_order ON User_Pinned_Items(Contact_ID, Sort_Order);

-- Add comment
COMMENT ON TABLE User_Pinned_Items IS 'Stores user-pinned items for quick access on the homepage';
