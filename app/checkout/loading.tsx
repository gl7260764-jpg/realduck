export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading checkout...</p>
      </div>
    </div>
  );
}
