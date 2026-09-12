export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ProductReview {
  id: string
  name: string
  rating: number
  comment: string
  status: ReviewStatus
  createdAt: string
}

const STORAGE_KEY = 'etps-belle-odeur-reviews-v1'

export function readReviews(): ProductReview[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProductReview[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeReviews(reviews: ProductReview[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
}

export function addReview(input: { name: string; rating: number; comment: string }) {
  const review: ProductReview = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: input.name.trim(),
    rating: Math.min(5, Math.max(1, Number(input.rating) || 1)),
    comment: input.comment.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  const reviews = readReviews()
  writeReviews([review, ...reviews])
  return review
}

export function updateReviewStatus(id: string, status: ReviewStatus) {
  const reviews = readReviews()
  const next = reviews.map((review) =>
    review.id === id ? { ...review, status } : review
  )
  writeReviews(next)
  return next
}

export function deleteReview(id: string) {
  const reviews = readReviews().filter((review) => review.id !== id)
  writeReviews(reviews)
  return reviews
}

export function getPublishedReviews() {
  return readReviews().filter((review) => review.status === 'approved')
}

export function getPendingReviews() {
  return readReviews().filter((review) => review.status === 'pending')
}
