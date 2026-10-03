import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  console.log("=== Step 2: Login with wrong password ===");
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'test_subagent@company.com');
  await page.type('input[type="password"]', 'wrongpass');
  await page.click('button[type="submit"]');
  
  // Wait a bit to see if error appears or if it redirects
  await new Promise(r => setTimeout(r, 1000));
  
  const currentUrl1 = page.url();
  console.log("URL after bad login:", currentUrl1);
  const emailValue = await page.$eval('input[type="email"]', el => el.value).catch(() => null);
  const passwordValue = await page.$eval('input[type="password"]', el => el.value).catch(() => null);
  console.log("Email field retained:", emailValue === 'test_subagent@company.com');
  console.log("Password field retained:", passwordValue === 'wrongpass');
  
  const errorText = await page.$eval('.bg-rose-50', el => el.textContent).catch(() => null);
  console.log("Error text displayed:", errorText);

  console.log("\n=== Step 3: Login with correct password ===");
  // Ensure we have a user in DB (backend is running)
  // But wait, test_subagent@company.com might not exist yet if I didn't sign up.
  // Let's sign up first to make sure they exist for Step 3.
  await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle2' });
  await page.type('input[type="text"]', 'TestCorp');
  await page.type('input[type="email"]', 'test_subagent@company.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));
  
  console.log("URL after first signup:", page.url()); // should be /connect-amazon or /dashboard
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'test_subagent@company.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));
  
  console.log("URL after correct login:", page.url());
  
  console.log("\n=== Step 4: Signup duplicate ===");
  await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle2' });
  await page.type('input[type="text"]', 'TestCorp');
  await page.type('input[type="email"]', 'test_subagent@company.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  
  const errorTextSignup = await page.$eval('.bg-rose-50', el => el.textContent).catch(() => null);
  console.log("Signup Error text displayed:", errorTextSignup);
  
  console.log("\n=== Step 5: Unauthenticated access ===");
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  // clear storage
  await page.evaluate(() => localStorage.clear());
  // reload
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  console.log("URL after clear storage and reload /dashboard:", page.url());

  await browser.close();
})();
