import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RelationshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: '1:1' | '1:N' | 'N:1' | 'N:M') => void;
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
}

export const RelationshipDialog = ({
  isOpen,
  onClose,
  onSelect,
  sourceTable,
  targetTable,
  sourceColumn,
  targetColumn,
}: RelationshipDialogProps) => {
  const handleSelect = (type: '1:1' | '1:N' | 'N:1' | 'N:M') => {
    onSelect(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Relationship</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>From: <span className="font-medium">{sourceTable}.{sourceColumn}</span></p>
            <p>To: <span className="font-medium">{targetTable}.{targetColumn}</span></p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Select relationship type:</p>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSelect('1:1')}
            >
              <div className="text-left">
                <div className="font-medium">One-to-One (1:1)</div>
                <div className="text-xs text-gray-500">Each record relates to exactly one record</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSelect('1:N')}
            >
              <div className="text-left">
                <div className="font-medium">One-to-Many (1:N)</div>
                <div className="text-xs text-gray-500">One record can relate to many records</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSelect('N:1')}
            >
              <div className="text-left">
                <div className="font-medium">Many-to-One (N:1)</div>
                <div className="text-xs text-gray-500">Many records can relate to one record</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSelect('N:M')}
            >
              <div className="text-left">
                <div className="font-medium">Many-to-Many (N:M)</div>
                <div className="text-xs text-gray-500">Many records can relate to many records</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};