import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

export default function Feedback() {
  const [rating, setRating] = useState({
    overall: 0,
    doctor: 0,
    nurse: 0,
    facility: 0,
    waiting_time: 0
  });
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('SERVICE');
  const [submitted, setSubmitted] = useState(false);

  const RatingStars = ({ value, onChange, label }) => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 w-28">{label}:</span>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none"
            >
              {star <= value ? (
                <StarIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <StarOutlineIcon className="h-6 w-6 text-gray-300" />
              )}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500">({value}/5)</span>
      </div>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would call the API
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Submit Feedback</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your feedback helps us improve our services
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {submitted ? (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Thank you for your feedback!</h3>
            <p className="mt-1 text-sm text-gray-500">You earned 20 loyalty points</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Type
              </label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="SERVICE">Service Quality</option>
                <option value="FACILITY">Facility</option>
                <option value="STAFF">Staff</option>
                <option value="GENERAL">General</option>
                <option value="COMPLAINT">Complaint</option>
              </select>
            </div>

            {/* Ratings */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Rate Your Experience</h3>
              <RatingStars 
                value={rating.overall} 
                onChange={(val) => setRating({...rating, overall: val})}
                label="Overall"
              />
              <RatingStars 
                value={rating.doctor} 
                onChange={(val) => setRating({...rating, doctor: val})}
                label="Doctor"
              />
              <RatingStars 
                value={rating.nurse} 
                onChange={(val) => setRating({...rating, nurse: val})}
                label="Nursing Staff"
              />
              <RatingStars 
                value={rating.facility} 
                onChange={(val) => setRating({...rating, facility: val})}
                label="Facility"
              />
              <RatingStars 
                value={rating.waiting_time} 
                onChange={(val) => setRating({...rating, waiting_time: val})}
                label="Waiting Time"
              />
            </div>

            {/* Feedback Text */}
            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Your Feedback
              </label>
              <textarea
                id="feedback"
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Please share your experience with us..."
                required
              />
            </div>

            {/* Would Recommend */}
            <div className="flex items-center">
              <input
                id="recommend"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="recommend" className="ml-2 block text-sm text-gray-900">
                I would recommend this hospital to others
              </label>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recent Feedback */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Recent Feedback</h2>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <StarIcon key={star} className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">October 5, 2025</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  Great service from the medical team. The facility was clean and well-maintained.
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                RESOLVED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
