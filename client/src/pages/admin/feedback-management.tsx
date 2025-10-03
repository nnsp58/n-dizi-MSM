import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Send, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { FEEDBACK_CATEGORIES, type Feedback, type User } from '@shared/schema';
import { Link, useLocation } from 'wouter';

export default function AdminFeedbackManagement() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Check if user is admin  
  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You do not have permission to access this admin page.</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: allFeedback = [], isLoading, refetch } = useQuery<Feedback[]>({
    queryKey: ['/api/feedback', statusFilter],
    queryFn: async () => {
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/feedback${query}`);
      return res.json();
    }
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      return apiRequest('PUT', `/api/feedback/${id}`, {
        status: 'responded',
        adminResponse: response,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Response Sent!',
        description: 'Your response has been sent to the user.',
      });
      setShowResponseModal(false);
      setSelectedFeedback(null);
      setAdminResponse('');
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send response. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminResponse(feedback.adminResponse || '');
    setShowResponseModal(true);
  };

  const handleSendResponse = () => {
    if (!selectedFeedback || !adminResponse.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a response',
        variant: 'destructive',
      });
      return;
    }

    respondMutation.mutate({
      id: selectedFeedback.id,
      response: adminResponse,
    });
  };

  const pendingCount = allFeedback.filter(f => f.status === 'pending').length;
  const respondedCount = allFeedback.filter(f => f.status === 'responded').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              Admin - Feedback Management
            </h1>
            <p className="text-muted-foreground mt-1">
              View and respond to user feedback
            </p>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm" data-testid="button-back-to-settings">
              Back
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{allFeedback.length}</p>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{respondedCount}</p>
                <p className="text-sm text-muted-foreground">Responded</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="status-filter">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" data-testid="select-status-filter">
                    <SelectValue placeholder="All Feedback" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Feedback</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>All Feedback</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading feedback...' : `Showing ${allFeedback.length} feedback items`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : allFeedback.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No feedback yet</p>
            ) : (
              allFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`admin-feedback-${feedback.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{feedback.subject}</p>
                        <Badge
                          variant={feedback.status === 'responded' ? 'default' : 'secondary'}
                          data-testid={`badge-status-${feedback.id}`}
                        >
                          {feedback.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span>
                          {FEEDBACK_CATEGORIES[feedback.category as keyof typeof FEEDBACK_CATEGORIES]}
                        </span>
                        <span>•</span>
                        <div className="flex">
                          {[...Array(feedback.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{new Date(feedback.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm">{feedback.message}</p>

                  {feedback.adminResponse && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-semibold text-primary mb-1">Your Response:</p>
                      <p className="text-sm">{feedback.adminResponse}</p>
                      {feedback.adminRespondedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Responded on {new Date(feedback.adminRespondedAt).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleRespond(feedback)}
                      size="sm"
                      variant={feedback.adminResponse ? 'outline' : 'default'}
                      data-testid={`button-respond-${feedback.id}`}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {feedback.adminResponse ? 'Update Response' : 'Respond'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent data-testid="dialog-admin-response">
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              Send a response to the user's feedback
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-xs font-semibold mb-1">User's Feedback:</p>
                <p className="text-sm font-medium">{selectedFeedback.subject}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedFeedback.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-response">Your Response</Label>
                <Textarea
                  id="admin-response"
                  placeholder="Type your response here..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={6}
                  data-testid="textarea-admin-response"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseModal(false)}
              data-testid="button-cancel-response"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendResponse}
              disabled={respondMutation.isPending}
              data-testid="button-send-response"
            >
              <Send className="mr-2 h-4 w-4" />
              {respondMutation.isPending ? 'Sending...' : 'Send Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
