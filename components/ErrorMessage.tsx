interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[400px] bg-red-50 rounded-lg">
      <div className="text-red-600 text-center">
        <h3 className="font-semibold mb-2">Error Loading Map</h3>
        <p>{message}</p>
      </div>
    </div>
  )
}

