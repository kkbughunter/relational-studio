import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSchemaStore } from '@/store/useSchemaStore';

export const ClearConfirmDialog = () => {
  const { showClearConfirmDialog, setShowClearConfirmDialog, confirmClearAll } = useSchemaStore();

  return (
    <AlertDialog open={showClearConfirmDialog} onOpenChange={setShowClearConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Schema Elements?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clear all tables, relations, and groups? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmClearAll} className="bg-red-600 hover:bg-red-700">
            Clear All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};