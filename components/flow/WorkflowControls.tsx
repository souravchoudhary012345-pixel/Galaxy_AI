"use client";

import { useState } from "react";
import { useFlowStore } from "@/store/flowStore";
import { Node, Edge } from "reactflow";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, FolderOpen, Loader2, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function WorkflowControls() {
    const { nodes, edges, setWorkflow } = useFlowStore();
    const utils = trpc.useUtils();

    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
    const [workflowName, setWorkflowName] = useState("");
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // tRPC Hooks
    const createWorkflow = trpc.workflow.create.useMutation({
        onSuccess: () => {
            setSaveDialogOpen(false);
            setWorkflowName("");
            utils.workflow.getAll.invalidate();
        },
    });

    const { data: workflows, isPending: isLoadingWorkflows } =
        trpc.workflow.getAll.useQuery(undefined, {
            enabled: loadDialogOpen,
        });

    const deleteWorkflow = trpc.workflow.delete.useMutation({
        onSuccess: () => {
            utils.workflow.getAll.invalidate();
        }
    })

    const handleSave = () => {
        if (!workflowName.trim()) return;
        createWorkflow.mutate({
            name: workflowName,
            nodes: nodes,
            edges: edges,
        });
    };

    const handleLoad = async (id: string) => {
        try {
            setLoadingId(id);
            const data = await utils.workflow.getById.fetch({ id });
            if (data && data.nodes && data.edges) {
                setWorkflow(data.nodes as Node[], data.edges as Edge[]);
                setLoadDialogOpen(false);
            }
        } catch (error) {
            console.error("Failed to load workflow", error);
        } finally {
            setLoadingId(null);
        }
    }

    return (
        <div className="flex items-center gap-2">
            {/* Save Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Save className="h-4 w-4" />
                        Save
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                placeholder="My Awesome Workflow"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={createWorkflow.isPending}>
                            {createWorkflow.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Load Dialog */}
            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Load
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Load Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="h-[300px] w-full border rounded-md p-4">
                        {isLoadingWorkflows ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : workflows?.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No saved workflows found.
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="space-y-2">
                                    {workflows?.map((wf: { id: string; name: string; updatedAt: Date }) => (
                                        <div
                                            key={wf.id}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-sm text-foreground">{wf.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(wf.updatedAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleLoad(wf.id)}
                                                    disabled={loadingId === wf.id}
                                                >
                                                    {loadingId === wf.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Load"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => deleteWorkflow.mutate({ id: wf.id })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
