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

  // History stacks for undo/redo
  type DiagramSnapshot = {
    entities: EntityData[];
    relationships: RelationshipData[];
    selectedEntityId: string | null;
    selectedRelationshipId: string | null;
  };
  const [past, setPast] = useState<DiagramSnapshot[]>([]);
  const [future, setFuture] = useState<DiagramSnapshot[]>([]);

  const getSnapshot = (): DiagramSnapshot => ({
    entities,
    relationships,
    selectedEntityId,
    selectedRelationshipId,
  });

  const restoreSnapshot = (snap: DiagramSnapshot) => {
    setEntities(snap.entities);
    setRelationships(snap.relationships);
    setSelectedEntityId(snap.selectedEntityId);
    setSelectedRelationshipId(snap.selectedRelationshipId);
  };

  const pushHistory = () => {
    setPast((prev) => [...prev, getSnapshot()]);
    setFuture([]);
  };

  const handleUndo = () => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const newPast = prevPast.slice(0, -1);
      const previous = prevPast[prevPast.length - 1];
      const current = getSnapshot();
      restoreSnapshot(previous);
      setFuture((prevFuture) => [current, ...prevFuture]);
      return newPast;
    });
  };

  const handleRedo = () => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const [next, ...rest] = prevFuture;
      const current = getSnapshot();
      setPast((prevPast) => [...prevPast, current]);
      restoreSnapshot(next);
      return rest;
    });
  };

  const handleUpdateEntity = (updatedEntity: EntityData) => {
    // Push history before applying the update
    pushHistory();
    setEntities((prev) => {
      const existing = prev.find((e) => e.id === updatedEntity.id);
      if (existing) {
        return prev.map((e) => (e.id === updatedEntity.id ? updatedEntity : e));
      }
      return [...prev, updatedEntity];
    });
  };

  const handleDeleteEntity = (id: string) => {
    pushHistory();
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
    pushHistory();
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

  const handleUpdateRelationship = (updatedRelationship: RelationshipData) => {
    setRelationships((prev) =>
      prev.map((r) => (r.id === updatedRelationship.id ? updatedRelationship : r))
    );
  };

  const handleDeleteRelationship = (id: string) => {
    pushHistory();
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
    pushHistory();
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
      pushHistory();
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

  // Keyboard shortcuts: Undo (Ctrl/Cmd+Z), Redo (Ctrl+Y or Ctrl+Shift+Z)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isInput =
        (e.target as HTMLElement)?.closest("input, textarea, [contenteditable=''], [contenteditable='true']");
      if (isInput) return; // Let native undo/redo work inside inputs

      const isMac = navigator.platform.toLowerCase().includes("mac");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrlOrCmd) return;

      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [past, future, entities, relationships, selectedEntityId, selectedRelationshipId]);

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
        onUpdateRelationship={handleUpdateRelationship}
        selectedTool={selectedTool}
        relationshipType={relationshipType}
        onCreateRelationship={handleCreateRelationship}
      />
    </div>
  );
};

export default Index;
