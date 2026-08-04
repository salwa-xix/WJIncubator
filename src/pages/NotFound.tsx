import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Leaf } from '@/components/brand/Leaf'

export default function NotFound() {
  useDocumentTitle('الصفحة غير موجودة')
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Leaf className="w-16 text-navy/15" />
      <div>
        <h1 className="text-3xl font-bold text-navy">الصفحة غير موجودة</h1>
        <p className="mt-2 text-muted">تعذّر العثور على الصفحة المطلوبة.</p>
      </div>
      <Link to="/">
        <Button variant="secondary">العودة إلى صفحة الدخول</Button>
      </Link>
    </div>
  )
}
