import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSchemaStore } from '@/store/useSchemaStore';

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bounds?: { x: number; y: number; width: number; height: number };
}

export const GroupDialog = ({ open, onOpenChange, bounds }: GroupDialogProps) => {
  const [groupName, setGroupName] = useState('');
  const { createGroupFromBounds } = useSchemaStore();

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleCreate = () => {
    if (groupName.trim()) {
      if (bounds) {
        createGroupFromBounds(groupName.trim(), selectedColor, bounds);
      }
      setGroupName('');
      onOpenChange(false);
      // Switch to select tool after creating group
      useSchemaStore.getState().setSelectedTool('select');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 ${
                    selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Creating group from selection area
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!groupName.trim()}>
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};