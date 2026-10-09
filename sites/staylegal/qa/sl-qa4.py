import subprocess, time, sys
from playwright.sync_api import sync_playwright

srv = subprocess.Popen(["python3", "-m", "http.server", "8934", "--directory", "/home/hatch/workspace/builds/staylegal"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
fails, passes = [], []
def check(name, cond, extra=""):
    (passes if cond else fails).append(name)
    print(("PASS " if cond else "FAIL ") + name + ((" | " + str(extra)) if extra and not cond else ""), flush=True)

errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errors.append("console-" + m.type + ": " + m.text) if m.type in ("error",) else None)
    pg.goto("http://localhost:8934/index.html")
    pg.wait_for_timeout(600)

    check("coveredCount=34 on first paint", pg.text_content("#coveredCount") == "34", pg.text_content("#coveredCount"))
    check("34 city chips on first paint", pg.eval_on_selector_all("#cityChips .chip", "e=>e.length") == 34,
          pg.eval_on_selector_all("#cityChips .chip", "e=>e.length"))
    check("saved section visible with empty state", pg.is_visible("#savedEmpty") and "No saved checks yet" in pg.text_content("#savedEmpty"))
    pg.click("#savedEmptyBtn"); pg.wait_for_timeout(400)
    check("empty-state button scrolls to checker", pg.evaluate("window.scrollY") < 200)

    pg.fill("#addressInput", "123 Main St, Los Angeles, CA")
    pg.click(".search .btn"); pg.wait_for_timeout(800)
    check("verdict card visible", pg.is_visible("#verdictCard"))
    check("confidence pill hand-researched", pg.text_content("#confidencePill") == "Hand-researched")
    check("permit lead shows cost", "$89" in pg.text_content("#permitLead"), pg.text_content("#permitLead"))
    check("HOA CTA present", pg.is_visible("#hoaCtaBtn"))
    pg.click("#hoaCtaBtn"); pg.wait_for_timeout(1500)
    check("HOA CTA scrolls to triage", pg.evaluate("document.getElementById('hoa-check').getBoundingClientRect().top") < 300,
          pg.evaluate("document.getElementById('hoa-check').getBoundingClientRect().top"))
    pg.evaluate("window.scrollTo(0,0)")

    check("night card visible for LA", pg.is_visible("#nightCard"))
    check("night line 0 of 120", "0 of 120 nights tracked per calendar year" in pg.text_content("#nightLine"), pg.text_content("#nightLine"))
    check("night honesty line", "Not a filing with the city" in pg.text_content("#nightCard"))
    pg.click("#nightPlus"); pg.wait_for_timeout(200)
    check("night +1", "1 of 120 nights tracked" in pg.text_content("#nightLine"))
    w = pg.eval_on_selector("#nightProgress", "e=>e.style.width")
    check("progress width > 0", w not in ("", "0%"), w)
    pg.click("#nightMinus"); pg.wait_for_timeout(200)
    check("night -1 back to 0", "0 of 120 nights tracked" in pg.text_content("#nightLine"))

    pg.click("#segHosted"); pg.wait_for_timeout(600)
    check("hosted toggle flips view", "hosted" in pg.text_content("#verdictHeadline").lower() or "live there" in pg.text_content("#verdictHeadline").lower() or "host" in pg.text_content("#verdictHeadline").lower(), pg.text_content("#verdictHeadline"))
    pg.click("#segInvestor"); pg.wait_for_timeout(400)

    pg.fill("#addressInput", "1 Main St, Denver, CO"); pg.click(".search .btn"); pg.wait_for_timeout(700)
    check("night card hidden for Denver", pg.eval_on_selector("#nightCard", "e=>e.classList.contains('hidden')"))

    pg.fill("#addressInput", "Boise, Idaho"); pg.click(".search .btn"); pg.wait_for_timeout(700)
    check("unknown panel shown", pg.is_visible("#unknownSection"))
    check("reqCity prefilled Boise", pg.input_value("#reqCity") == "Boise", pg.input_value("#reqCity"))
    check("3 request labels visible", pg.eval_on_selector_all(".req-form .flabel", "e=>e.length") == 3)
    pg.fill("#reqState", "ID"); pg.wait_for_timeout(300)
    pg.reload(); pg.wait_for_timeout(600)
    check("draft autosave restores reqState", pg.input_value("#reqState") == "ID", pg.input_value("#reqState"))

    pg.select_option("#cmpA", "los-angeles-ca"); pg.select_option("#cmpB", "austin-tx")
    pg.click("#cmpBtn"); pg.wait_for_timeout(500)
    check("compare table renders", "Los Angeles" in pg.text_content("#cmpOut") and "Austin" in pg.text_content("#cmpOut"))

    pg.fill("#addressInput", "5 Main St, Austin, TX"); pg.click(".search .btn"); pg.wait_for_timeout(700)
    pg.click("#saveBtn"); pg.wait_for_timeout(600)
    check("saved card appears", "Austin" in pg.text_content("#savedList"))
    check("saved card shows perspective+version", "Investor" in pg.text_content("#savedList") and "2026-10-10" in pg.text_content("#savedList"), pg.text_content("#savedList")[:120])
    check("saved empty state hidden now", not pg.is_visible("#savedEmpty"))

    pg.fill("#remindDate", pg.evaluate("new Date(Date.now()+20*864e5).toISOString().slice(0,10)")); pg.click("#remindSetBtn"); pg.wait_for_timeout(500)
    check("renewal countdown banner", "renew" in pg.text_content("#remindBannerSlot").lower(), pg.text_content("#remindBannerSlot")[:100])

    ev = pg.evaluate("JSON.parse(localStorage.getItem('staylegal.events')||'[]').map(e=>e.n)")
    check("check_run logged", "check_run" in ev, ev)
    check("save_check logged", "save_check" in ev)
    check("reminder_set logged", "reminder_set" in ev)

    pg.evaluate("document.getElementById('quiz').scrollIntoView()"); pg.wait_for_timeout(400)
    for step in range(4):
        opts = pg.eval_on_selector_all("#quizBody .quiz-opt", "e=>e.map(x=>x.textContent.trim())")
        check(f"quiz step {step+1} has options", len(opts) >= 2, opts)
        pg.eval_on_selector_all("#quizBody .quiz-opt", "e=>e[1].click()")
        pg.wait_for_timeout(300)
    check("quiz city input shown", pg.eval_on_selector("#quizCity", "e=>e") is not None)
    pg.fill("#quizCity", "Boise")
    pg.eval_on_selector_all("#quizBody .btn", "e=>{const b=e.find(x=>x.textContent.trim()==='See my read-back'); if(b) b.click();}")
    pg.wait_for_timeout(600)
    check("quiz outcome read-back", "Your situation" in pg.text_content("#quizBody"))
    check("quiz education footer", "education, not legal advice" in pg.text_content("#quizBody"))
    pg.eval_on_selector_all("#quizBody .quiz-cta .btn", "e=>{const b=e.find(x=>x.textContent.includes('Request')); if(b) b.click();}")
    pg.wait_for_timeout(800)
    check("quiz Request CTA prefills reqCity", pg.input_value("#reqCity") == "Boise", pg.input_value("#reqCity"))
    ev2 = pg.evaluate("JSON.parse(localStorage.getItem('staylegal.events')||'[]').map(e=>e.n)")
    check("quiz_complete logged", "quiz_complete" in ev2)

    # offline banner: load online, then drop the network
    check("offline banner hidden online", pg.eval_on_selector("#offlineBanner", "e=>e.classList.contains('hidden')"))
    ctx.set_offline(True)
    pg.wait_for_timeout(800)
    check("offline banner visible when offline", pg.is_visible("#offlineBanner"))
    check("offline banner honest", "still work" in pg.text_content("#offlineBanner"))
    ctx.set_offline(False)
    pg.wait_for_timeout(400)
    check("offline banner hides when back online", pg.eval_on_selector("#offlineBanner", "e=>e.classList.contains('hidden')"))
    b.close()

srv.kill()
print("page/console errors:", errors, flush=True)
print(f"\n{len(passes)} passed, {len(fails)} failed", flush=True)
sys.exit(1 if fails or errors else 0)
