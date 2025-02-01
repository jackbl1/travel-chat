interface MapsInfoMessageProps {
  message: string;
  title?: string;
}

export default function MapsInfoMessage({ message, title = 'Map Information' }: MapsInfoMessageProps) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[400px] bg-slate-50 rounded-lg">
      <div className="text-slate-600 text-center">
        <h3 className="font-semibold mb-2">{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  )
}
