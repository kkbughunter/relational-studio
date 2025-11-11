import { useEffect, useState } from "react";
import { Toolbar } from "@/components/Toolbar";
import { Canvas } from "@/components/Canvas";
import { EntityData } from "@/components/Entity";
import { RelationshipData, RelationshipType } from "@/components/Relationship";
import { toast } from "sonner";

const Index = () => {
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [relationships, setRelationships] = useState<RelationshipData[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<"select" | "entity" | "relationship">("select");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("one-to-many");

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
    // Also delete any relationships connected to this entity
    setRelationships((prev) =>
      prev.filter((r) => r.sourceEntityId !== id && r.targetEntityId !== id)
    );
    if (selectedEntityId === id) {
      setSelectedEntityId(null);
    }
    toast.success("Entity deleted");
  };

  const handleCreateRelationship = (
    sourceEntityId: string,
    targetEntityId: string,
    sourceAttributeId?: string,
    targetAttributeId?: string
  ) => {
    const newRelationship: RelationshipData = {
      id: `rel-${Date.now()}`,
      sourceEntityId,
      targetEntityId,
      type: relationshipType,
      sourceAttributeId,
      targetAttributeId,
    };
    setRelationships((prev) => [...prev, newRelationship]);
    toast.success(`${relationshipType} relationship created`);
  };

  const handleDeleteRelationship = (id: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== id));
    if (selectedRelationshipId === id) {
      setSelectedRelationshipId(null);
    }
    toast.success("Relationship deleted");
  };

  const handleClear = () => {
    if (entities.length === 0 && relationships.length === 0) {
      toast.info("Canvas is already empty");
      return;
    }
    setEntities([]);
    setRelationships([]);
    setSelectedEntityId(null);
    setSelectedRelationshipId(null);
    toast.success("Canvas cleared");
  };

  const handleToolChange = (tool: "select" | "entity" | "relationship") => {
    setSelectedTool(tool);
    if (tool === "entity") {
      toast.info("Click on the canvas to add an entity");
    } else if (tool === "relationship") {
      toast.info("Click on two entities to create a relationship");
    }
  };

  const handleExport = () => {
    if (entities.length === 0 && relationships.length === 0) {
      toast.error("Nothing to export. Add some entities first.");
      return;
    }

    const diagramData = {
      version: "1.0",
      entities,
      relationships,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `er-diagram-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Diagram exported successfully!");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the structure
      if (!data.entities || !Array.isArray(data.entities)) {
        toast.error("Invalid diagram file: missing entities");
        return;
      }

      if (!data.relationships || !Array.isArray(data.relationships)) {
        toast.error("Invalid diagram file: missing relationships");
        return;
      }

      // Load the data
      setEntities(data.entities);
      setRelationships(data.relationships);
      setSelectedEntityId(null);
      setSelectedRelationshipId(null);

      toast.success(
        `Diagram imported! Loaded ${data.entities.length} entities and ${data.relationships.length} relationships.`
      );
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import diagram. Please check the file format.");
    }
  };

  // Auto-export (via local backup) on reload with confirm, and restore on next load
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasContent = entities.length > 0 || relationships.length > 0;
      if (!hasContent) return;

      // Save a backup snapshot to localStorage so we can export it on next load
      const snapshot = {
        version: "1.0",
        entities,
        relationships,
        exportedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem("er_autosave_snapshot", JSON.stringify(snapshot));
      } catch {}

      // Show browser confirm dialog
      e.preventDefault();
      e.returnValue = "Export your diagram before leaving? A backup will be auto-exported on next load.";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [entities, relationships]);

  useEffect(() => {
    // If there is a snapshot from a previous unload, auto-download it once
    const raw = localStorage.getItem("er_autosave_snapshot");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `er-diagram-autosave-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.info("Auto-exported your diagram from the previous session.");
    } catch {}
    localStorage.removeItem("er_autosave_snapshot");
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">ER Diagram Designer</h1>
        <p className="text-sm text-muted-foreground">Create and design entity relationship diagrams</p>
      </header>

      <Toolbar
        selectedTool={selectedTool}
        relationshipType={relationshipType}
        onToolChange={handleToolChange}
        onRelationshipTypeChange={setRelationshipType}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport}
      />

      <Canvas
        entities={entities}
        relationships={relationships}
        selectedEntityId={selectedEntityId}
        selectedRelationshipId={selectedRelationshipId}
        onSelectEntity={setSelectedEntityId}
        onSelectRelationship={setSelectedRelationshipId}
        onUpdateEntity={handleUpdateEntity}
        onDeleteEntity={handleDeleteEntity}
        onDeleteRelationship={handleDeleteRelationship}
        selectedTool={selectedTool}
        relationshipType={relationshipType}
        onCreateRelationship={handleCreateRelationship}
      />
    </div>
  );
};

export default Index;
