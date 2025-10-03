import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FEEDBACK_CATEGORIES, type Feedback, type FeedbackCategory } from '@shared/schema';
import { Link } from 'wouter';

export default function FeedbackPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [rating, setRating] = useState(5);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { data: userFeedback = [], isLoading: isLoadingFeedback } = useQuery<Feedback[]>({
    queryKey: ['/api/feedback'],
    enabled: !!user,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/feedback', data);
    },
    onSuccess: () => {
      toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for your feedback. We will review it soon.',
      });
      setSubject('');
      setMessage('');
      setRating(5);
      setCategory('general');
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    submitFeedbackMutation.mutate({
      category,
      rating,
      subject,
      message,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-7 w-7" />
              Feedback & Support
            </h1>
            <p className="text-muted-foreground mt-1">
              Share your thoughts and help us improve
            </p>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm" data-testid="button-back-to-settings">
              Back
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
            <CardDescription>
              Tell us about bugs, suggest features, or share your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as FeedbackCategory)}>
                  <SelectTrigger id="category" data-testid="select-feedback-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEEDBACK_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key} data-testid={`option-category-${key}`}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      data-testid={`button-rating-${star}`}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground self-center">
                    {rating} out of 5 stars
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your feedback"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  data-testid="input-feedback-subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Please provide detailed feedback..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  data-testid="textarea-feedback-message"
                />
              </div>

              <Button
                type="submit"
                disabled={submitFeedbackMutation.isPending}
                className="w-full"
                data-testid="button-submit-feedback"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {userFeedback.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Previous Feedback</CardTitle>
              <CardDescription>
                View your submitted feedback and admin responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingFeedback ? (
                <p className="text-muted-foreground text-center py-4">Loading...</p>
              ) : (
                userFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 space-y-2"
                    data-testid={`feedback-item-${item.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{item.subject}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{FEEDBACK_CATEGORIES[item.category as FeedbackCategory]}</span>
                          <span>•</span>
                          <div className="flex">
                            {[...Array(item.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.status === 'responded'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                        data-testid={`status-${item.id}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                    
                    {item.adminResponse && (
                      <div className="mt-3 bg-muted p-3 rounded-md">
                        <p className="text-xs font-semibold text-primary mb-1">Admin Response:</p>
                        <p className="text-sm" data-testid={`admin-response-${item.id}`}>
                          {item.adminResponse}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Submitted on {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
