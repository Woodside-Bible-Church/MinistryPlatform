"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, Upload, Download, Link2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface FileAttachment {
  FileId: number;
  FileName: string;
  FileSize: number;
  FileExtension: string;
  ImageWidth: number | null;
  ImageHeight: number | null;
  UniqueFileId: string;
  Description: string | null;
  LastUpdated: string;
  publicUrl: string;
}

interface FileAttachmentsProps {
  files: FileAttachment[];
  uploadEndpoint: string;
  onFilesUploaded: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isImageFile(fileName: string, fileExtension?: string, imageWidth?: number | null, imageHeight?: number | null): boolean {
  // First check if MinistryPlatform detected it as an image (most reliable)
  if (imageWidth && imageHeight && imageWidth > 0 && imageHeight > 0) {
    return true;
  }

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];

  // Check the explicit FileExtension field if provided
  if (fileExtension) {
    const ext = fileExtension.toLowerCase();
    return imageExtensions.includes(ext) || imageExtensions.includes('.' + ext);
  }

  // Fall back to checking the filename extension
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(extension);
}

export function FileAttachments({ files, uploadEndpoint, onFilesUploaded }: FileAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<FileAttachment | null>(null);
  const [editFileName, setEditFileName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}...`);

    try {
      const formData = new FormData();
      Array.from(uploadedFiles).forEach(file => {
        formData.append("files", file);
      });

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload files: ${response.status} ${errorText}`);
      }

      toast.success(`${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded successfully`, { id: toastId });
      onFilesUploaded();
    } catch (err) {
      console.error("Error uploading files:", err);
      toast.error("Failed to upload files. Please try again.", { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const copyPublicUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public URL copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy URL:", err);
      toast.error("Failed to copy URL to clipboard");
    }
  };

  const handleEditFile = (file: FileAttachment) => {
    setEditingFile(file);
    setEditFileName(file.FileName);
    setEditDescription(file.Description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;

    setIsSaving(true);
    const toastId = toast.loading("Updating file...");

    try {
      const params = new URLSearchParams();

      // Ensure file extension is preserved
      let finalFileName = editFileName;
      if (editingFile.FileExtension) {
        const ext = editingFile.FileExtension.startsWith('.')
          ? editingFile.FileExtension
          : `.${editingFile.FileExtension}`;

        // Check if filename already has an extension
        const hasExtension = editFileName.includes('.') && editFileName.lastIndexOf('.') > 0;

        // If no extension in filename, add the original extension
        if (!hasExtension) {
          finalFileName = editFileName + ext;
        }
      }

      if (finalFileName && finalFileName !== editingFile.FileName) {
        params.append("fileName", finalFileName);
      }
      if (editDescription !== (editingFile.Description || "")) {
        params.append("description", editDescription);
      }

      // Use numeric FileId as per MP API documentation
      const response = await fetch(`/api/files/${editingFile.FileId}?${params.toString()}`, {
        method: "PUT",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update file: ${response.status} ${errorText}`);
      }

      toast.success("File updated successfully", { id: toastId });
      setEditingFile(null);
      onFilesUploaded(); // Refresh the file list
    } catch (err) {
      console.error("Error updating file:", err);
      toast.error("Failed to update file. Please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!deletingFileId) return;

    setIsDeleting(true);
    const toastId = toast.loading("Deleting file...");

    try {
      const response = await fetch(`/api/files/${deletingFileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete file: ${response.status} ${errorText}`);
      }

      toast.success("File deleted successfully", { id: toastId });
      setDeletingFileId(null);
      onFilesUploaded(); // Refresh the file list
    } catch (err) {
      console.error("Error deleting file:", err);
      toast.error("Failed to delete file. Please try again.", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5" />
          Attached Files
        </h2>

        {files && files.length > 0 ? (
          <div className="space-y-2 mb-4">
            {files.map((file) => {
              const isImage = isImageFile(file.FileName, file.FileExtension, file.ImageWidth, file.ImageHeight);
              return (
                <div
                  key={file.FileId}
                  className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  {/* Thumbnail and actions row */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    {/* Small thumbnail */}
                    {isImage ? (
                      <div
                        className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted/30 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => setSelectedImage(file.publicUrl)}
                      >
                        <Image
                          src={file.publicUrl}
                          alt={file.FileName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 flex-shrink-0 rounded bg-muted/30 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.publicUrl, "_blank")}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPublicUrl(file.publicUrl)}
                        title="Copy public link"
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFile(file)}
                        title="Edit file name"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingFileId(file.FileId)}
                        title="Delete file"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File info row - spans full width */}
                  <div className="text-xs text-muted-foreground/70 truncate">
                    {file.FileName} • {formatFileSize(file.FileSize)} •{" "}
                    {formatDate(file.LastUpdated)}
                    {file.Description && ` • ${file.Description}`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground mb-4">
            No files attached yet. Upload files like quotes or receipts.
          </div>
        )}

        {/* Upload button at bottom */}
        <div className="mt-4">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <button
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={isUploading}
            className="w-full py-3 px-6 border-2 border-dashed border-border hover:border-[#61bc47] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-[#61bc47] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full">
              <Image
                src={selectedImage}
                alt="Full size preview"
                width={1200}
                height={800}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit File Dialog */}
      <Dialog open={editingFile !== null} onOpenChange={() => setEditingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
            <DialogDescription>
              Update the file name and description. The file content will remain unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                placeholder="Enter file name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingFile(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !editFileName}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingFileId !== null} onOpenChange={() => setDeletingFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
