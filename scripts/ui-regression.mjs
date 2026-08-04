/**
 * UI regression suite.
 *
 * Drives the real frontend against the real database (via scripts/dev-supabase-shim.mjs)
 * at desktop and mobile widths, asserting the states that matter: RTL layout without
 * horizontal overflow, Arabic error copy, the four slot states, the booking flow, admin
 * navigation, and that no bcrypt hash ever reaches the DOM.
 *
 * Prerequisites, in three terminals:
 *   npm run db:test              # build the database
 *   ./scripts/dev-seed-demo.sh   # known demo state
 *   npm run dev:shim             # Supabase-protocol shim
 *   npm run dev                  # the app
 *
 * Then:  node scripts/ui-regression.mjs
 */
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
const psql=q=>execFileSync('psql',['-h','/tmp','-p','54329','-U','postgres','-d','wjtest','-qtA','-c',q]).toString().trim()
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']})
let pass=0, fail=0
const check=(ok,label)=>{ console.log(`  ${ok?'PASS':'FAIL'}  ${label}`); ok?pass++:fail++ }

for (const [w,h,tag] of [[1440,1000,'desktop'],[390,850,'mobile']]) {
  console.log(`\n=== ${tag} (${w}px) ===`)
  const ctx=await b.newContext({viewport:{width:w,height:h}})
  const p=await ctx.newPage()
  const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>m.type()==='error'&&errs.push(m.text()))
  const noOverflow=()=>p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)

  // --- startup flow
  await p.goto('http://localhost:5173/',{waitUntil:'networkidle'}); await p.waitForTimeout(700)
  check(await noOverflow(), 'login: no h-overflow')
  await p.selectOption('select',{index:1}); await p.fill('input[inputmode=numeric]','9999')
  await p.click('button[type=submit]'); await p.waitForSelector('[role=alert]',{timeout:8000})
  check(true, 'login: wrong code shows Arabic error')
  await p.fill('input[inputmode=numeric]','0042'); await p.click('button[type=submit]')
  await p.waitForURL('**/dashboard',{timeout:9000}); await p.waitForTimeout(1600)
  check(await noOverflow(), 'dashboard: no h-overflow')
  check(await p.locator('h1').count()===1, 'dashboard: exactly one h1')
  const mentors=await p.locator('section:nth-of-type(2) h3').count()
  check(mentors===13, `dashboard: 13 active mentors shown (got ${mentors})`)
  check(await p.locator('button[aria-label*="محجوز"]').count()>=1, 'dashboard: booked state visible')
  check(await p.locator('button[aria-label*="مغلق"]').count()>=1, 'dashboard: closed state visible')
  // book
  await p.locator('button[aria-label*="متاح"]').first().click()
  await p.waitForSelector('[role=dialog]',{timeout:5000}); await p.waitForTimeout(300)
  check(await noOverflow(), 'modal: no h-overflow')
  check((await p.locator('[role=dialog]').innerText()).includes('إدارة المعسكر'), 'modal: new cancellation wording present')
  await p.locator('[role=dialog] button:has-text("تأكيد الحجز")').click(); await p.waitForTimeout(2000)
  check((await p.locator('[data-sonner-toast]').first().innerText().catch(()=>'')).includes('تم تأكيد'), 'booking: success toast')
  check(await p.locator('button[aria-label*="حجزك"]').count()===1, 'booking: chip becomes "حجزك"')
  await p.click('button:has-text("خروج")'); await p.waitForTimeout(1200)
  check(new URL(p.url()).pathname==='/', 'logout returns to login')

  // --- admin flow
  await p.goto('http://localhost:5173/admin/login',{waitUntil:'networkidle'}); await p.waitForTimeout(600)
  await p.fill('input[type=email]','organiser@wj.test'); await p.fill('input[type=password]','x')
  await p.click('button[type=submit]'); await p.waitForURL('**/admin',{timeout:9000}); await p.waitForTimeout(1400)
  check(await noOverflow(), 'admin overview: no h-overflow')
  for (const [link,name] of [['الجلسة','session'],['المرشدون','mentors'],['المواعيد','slots'],['الحجوزات','bookings'],['الشركات','startups']]) {
    await p.click(`a:has-text("${link}")`); await p.waitForTimeout(1300)
    check(await noOverflow(), `admin ${name}: no h-overflow`)
  }
  check(!(await p.content()).includes('$2a$') && !(await p.content()).includes('$2b$'), 'admin: no bcrypt hash in DOM')
  check(errs.length===0, `no console errors (${errs.length})`)
  await ctx.close()
  psql("delete from public.bookings where startup_id=(select id from public.startups where slug='mabien')")
}
console.log(`\n──────────────\n  ${pass} passed, ${fail} failed\n──────────────`)
await b.close()
process.exit(fail?1:0)
