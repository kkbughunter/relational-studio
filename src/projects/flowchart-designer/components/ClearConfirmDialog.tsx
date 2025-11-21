import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFlowchartStore } from '@/projects/flowchart-designer/store/useFlowchartStore';

export const ClearConfirmDialog = () => {
  const { showClearConfirmDialog, setShowClearConfirmDialog, confirmClearAll } = useFlowchartStore();

  return (
    <AlertDialog open={showClearConfirmDialog} onOpenChange={setShowClearConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Flowchart Elements?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clear all nodes and connections? This action cannot be undone.
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