import { useState } from "react";
import { Toolbar } from "@/components/Toolbar";
import { Canvas } from "@/components/Canvas";
import { EntityData } from "@/components/Entity";
import { toast } from "sonner";

const Index = () => {
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<"select" | "entity">("select");

  const handleUpdateEntity = (updatedEntity: EntityData) => {
    setEntities((prev) => {
      const existing = prev.find((e) => e.id === updatedEntity.id);
      if (existing) {
        return prev.map((e) => (e.id === updatedEntity.id ? updatedEntity : e));
      }
      return [...prev, updatedEntity];
    });
  };

  const handleDeleteEntity = (id: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntityId === id) {
      setSelectedEntityId(null);
    }
    toast.success("Entity deleted");
  };

  const handleClear = () => {
    if (entities.length === 0) {
      toast.info("Canvas is already empty");
      return;
    }
    setEntities([]);
    setSelectedEntityId(null);
    toast.success("Canvas cleared");
  };

  const handleToolChange = (tool: "select" | "entity") => {
    setSelectedTool(tool);
    if (tool === "entity") {
      toast.info("Click on the canvas to add an entity");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">ER Diagram Designer</h1>
        <p className="text-sm text-muted-foreground">Create and design entity relationship diagrams</p>
      </header>

      <Toolbar
        selectedTool={selectedTool}
        onToolChange={handleToolChange}
        onClear={handleClear}
      />

      <Canvas
        entities={entities}
        selectedEntityId={selectedEntityId}
        onSelectEntity={setSelectedEntityId}
        onUpdateEntity={handleUpdateEntity}
        onDeleteEntity={handleDeleteEntity}
        selectedTool={selectedTool}
      />
    </div>
  );
};

export default Index;
