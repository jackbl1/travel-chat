export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[400px] bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

