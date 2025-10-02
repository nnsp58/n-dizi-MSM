import { useState, useEffect } from 'react';
import { PWAUtils } from '@/lib/pwa-utils';

export function useFeedback() {
  const [shouldShowFeedback, setShouldShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    checkFeedbackEligibility();
  }, []);

  const checkFeedbackEligibility = () => {
    const firstUseDate = localStorage.getItem('firstUseDate');
    const feedbackSubmitted = localStorage.getItem('feedbackSubmitted');
    
    if (!feedbackSubmitted && firstUseDate) {
      const daysSinceFirstUse = Math.floor(
        (new Date().getTime() - new Date(firstUseDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceFirstUse >= 14) {
        // Show feedback modal after a delay when user opens the app
        setTimeout(() => {
          setShouldShowFeedback(true);
        }, 2000);
      }
    }
  };

  const submitFeedback = () => {
    if (rating === 0) {
      PWAUtils.showToast('Please select a rating', 'error');
      return;
    }

    const subject = `App Feedback - ${rating} Star${rating !== 1 ? 's' : ''}`;
    const body = `Rating: ${rating}/5 stars\n\nComments:\n${comment}\n\n--- \nSubmitted from n-dizi Store Manager`;
    
    PWAUtils.openMailto('admin@myapp.com', subject, body);
    
    // Mark feedback as submitted
    localStorage.setItem('feedbackSubmitted', 'true');
    localStorage.setItem('feedbackDate', new Date().toISOString());
    
    setShouldShowFeedback(false);
    setRating(0);
    setComment('');
    
    PWAUtils.showToast('Thank you for your feedback!', 'success');
  };

  const dismissFeedback = () => {
    setShouldShowFeedback(false);
    // Don't mark as submitted, so it may show again later
  };

  const forceFeedback = () => {
    setShouldShowFeedback(true);
  };

  return {
    shouldShowFeedback,
    rating,
    comment,
    setRating,
    setComment,
    submitFeedback,
    dismissFeedback,
    forceFeedback
  };
}
