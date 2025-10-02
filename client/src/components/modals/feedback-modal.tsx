import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFeedback } from '@/hooks/use-feedback';

export default function FeedbackModal() {
  const {
    shouldShowFeedback,
    rating,
    comment,
    setRating,
    setComment,
    submitFeedback,
    dismissFeedback
  } = useFeedback();

  const [hoveredStar, setHoveredStar] = useState(0);

  const handleStarClick = (star: number) => {
    setRating(star);
  };

  const handleStarHover = (star: number) => {
    setHoveredStar(star);
  };

  const renderStar = (index: number) => {
    const isFilled = (hoveredStar || rating) >= index;
    return (
      <button
        key={index}
        type="button"
        onClick={() => handleStarClick(index)}
        onMouseEnter={() => handleStarHover(index)}
        onMouseLeave={() => setHoveredStar(0)}
        className={`text-4xl transition-colors ${
          isFilled ? 'text-yellow-400' : 'text-gray-300'
        } hover:text-yellow-400`}
      >
        <i className={`fas fa-star`}></i>
      </button>
    );
  };

  return (
    <Dialog open={shouldShowFeedback} onOpenChange={dismissFeedback}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How's Your Experience?</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your feedback helps us improve
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Star Rating */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3 text-center">
              Rate your experience
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(renderStar)}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Comments (Optional)
            </label>
            <Textarea
              rows={4}
              placeholder="Tell us what you think..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={submitFeedback} className="flex-1">
              Submit Feedback
            </Button>
            <Button onClick={dismissFeedback} variant="outline">
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
