import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Eye, User, FileText, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PendingUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  phone?: string;
  face_video_url: string;
  id_document_url: string;
  status: string;
  admin_notes?: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, isClient, isWorker } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_users')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch pending users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserDecision = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('pending_users')
        .update({
          status,
          admin_notes: adminNotes
        })
        .eq('id', userId);

      if (error) throw error;

      if (status === 'approved') {
        // Here you would typically create the actual user account
        // For now, we'll just update the status
        toast({
          title: "User Approved",
          description: "User has been approved and can now access the platform",
        });
      } else {
        toast({
          title: "User Rejected",
          description: "User application has been rejected",
        });
      }

      fetchPendingUsers();
      setSelectedUser(null);
      setAdminNotes('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage
      .from('face-verification')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const getDocumentUrl = (path: string) => {
    const { data } = supabase.storage
      .from('id-documents')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  // Redirect non-admin users
  if (!user || (isClient || isWorker)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and approve user registrations
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Applications ({pendingUsers.length})</TabsTrigger>
            <TabsTrigger value="history">Review History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : pendingUsers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No pending applications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingUsers.map((user) => (
                  <Card key={user.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {user.first_name} {user.last_name}
                          </CardTitle>
                          <CardDescription>
                            {user.email} • {user.user_type}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {user.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          Applied: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Review Application</DialogTitle>
                              <DialogDescription>
                                {user.first_name} {user.last_name} - {user.user_type}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedUser && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Personal Information</h4>
                                    <div className="text-sm space-y-1">
                                      <p><span className="font-medium">Name:</span> {user.first_name} {user.last_name}</p>
                                      <p><span className="font-medium">Email:</span> {user.email}</p>
                                      <p><span className="font-medium">Phone:</span> {user.phone || 'Not provided'}</p>
                                      <p><span className="font-medium">Type:</span> {user.user_type}</p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Camera className="w-4 h-4" />
                                    Face Verification Video
                                  </h4>
                                  <div className="max-w-md">
                                    <video 
                                      src={getImageUrl(user.face_video_url)}
                                      controls
                                      className="w-full aspect-video object-cover rounded-lg border"
                                    >
                                      Your browser does not support video playback.
                                    </video>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    ID Document
                                  </h4>
                                  <img 
                                    src={getDocumentUrl(user.id_document_url)}
                                    alt="ID Document"
                                    className="max-w-md aspect-[3/2] object-cover rounded-lg border"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="admin-notes">Admin Notes</Label>
                                  <Textarea
                                    id="admin-notes"
                                    placeholder="Add notes about this application..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="mt-2"
                                  />
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleUserDecision(user.id, 'rejected')}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90"
                                    onClick={() => handleUserDecision(user.id, 'approved')}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Review history coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;