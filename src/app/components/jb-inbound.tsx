import { Card } from "./ui/card";
import { Inbox } from "lucide-react";

export function JBInbound() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Inbound</h1>
      
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">Inbound Management</p>
          <p className="text-sm">Track and manage incoming jewelry items</p>
        </div>
      </Card>
    </div>
  );
}
