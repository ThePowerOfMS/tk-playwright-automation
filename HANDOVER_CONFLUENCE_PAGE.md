h1. Test Automation Handover - Playwright Tests

h2. Overview
This handover marks a significant milestone in our test automation modernization effort. We are transitioning critical UI test cases from Selenium to Playwright, minimizing test flakiness and addressing consistent failures in Selenium, while establishing a more reliable automation foundation for the TK (Timekeeping) application.

Additionally, we have migrated our CI/CD pipeline from Jenkins to *GitHub Actions (GHA)*, leveraging cloud-based GARM runners that provide fresh, isolated execution environments for every test run, further enhancing reliability and consistency.

----

h2. What, Why, and How

h3. What are we handing over?
UI automation test cases that have been *converted from Selenium to Playwright*. These tests cover critical timecard, setup, group edits, and timekeeping functionalities across the TK (Timekeeping) application.

h3. Why did we convert to Playwright?
* *Reduce Test Flakiness:* Selenium tests were experiencing frequent failures and instability
* *Improved Reliability:* Playwright provides better auto-waiting mechanisms and more stable element interactions
* *Faster Execution:* Modern architecture leads to quicker test runs
* *Better Maintainability:* Cleaner API and improved debugging capabilities
* *Enhanced Stability:* Built-in features for handling dynamic web applications
* *Modern CI/CD Pipeline:* GitHub Actions with GARM cloud runners provide fresh, isolated environments for every execution, eliminating environment-related failures common in Jenkins

h3. How were these tests migrated?
# Selected failing/flaky Selenium test cases for conversion
# Rewrote tests using Playwright framework and TypeScript
# Implemented page object model from {{playwright-platform}} repository
# Migrated CI/CD pipeline from Jenkins to GitHub Actions with GARM cloud-based runners
# Tagged all converted tests with {{@handover}} for easy identification
# Removed {{@flaky}} tags from converted tests
# Validated test execution and stability on target environment with fresh runner instances

{info}*Key Benefit:* These Playwright tests offer significantly improved stability compared to their Selenium counterparts, reducing maintenance overhead and increasing confidence in test results.{info}

----

h2. Current State

* *310 test cases* successfully converted from Selenium to Playwright
* All tests tagged with {{@handover}} and ready for client ownership
* Tests validated and stabilized on target environment with fresh GARM runner instances
* Comprehensive documentation and CSV report provided
* CI/CD pipeline migrated from Jenkins to GitHub Actions

{info}*Phase 1 Complete:* This handover represents the first phase of our Selenium-to-Playwright migration strategy.{info}

----

h2. Repository Information

h3. Test Repository
* *Repository:* UKGEPIC/tk-ui-tests
* *Branch:* feature/playwright-handover
* *GitHub URL:* [https://github.com/UKGEPIC/tk-ui-tests/tree/r9int/playwright-tests]
* *Test Framework:* Playwright (TypeScript)
* *CSV Report:* {{handover_tests_report.csv}}

Tests are organized in the following directory structure:
{code}
tests/
├── tk-enableEdits/
├── tk-groupedits/
├── tk-setup/
├── tk-timecard/
│   ├── accrualsaddon/
│   ├── commentsnotes/
│   ├── configuration/
│   ├── exceptions/
│   ├── multipositions/
│   ├── Navigation/
│   ├── punchRow/
│   └── ... (15+ subdirectories)
└── tk-timekeeping/
{code}

h3. Platform Code Repository
* *Repository:* UKGEPIC/playwright-platform
* *URL:* [https://github.com/UKGEPIC/playwright-platform]
* *Description:* Contains the core Playwright framework, utilities, and platform code used by the test suite

Page objects are organized in the following directory structure:
{code}
page-objects/
├── hcm/
├── suite/
└── wfm/
    └── pages/
        └── tk/
            ├── control-center/
            ├── login/
            ├── setup/
            ├── timekeeping/
            └── tk-menu-page/
utils/
├── api-helpers/
├── data-generators/
├── test-helpers/
└── ... (various utility modules)
{code}

----

h2. Test Categories

The handed-over tests cover the following major functional areas:

{section}
{column:width=33%}
{panel:title=⏱️ Timecard Management (145 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#E3F2FD|bgColor=#F5F5F5}
• Multiple Positions (38)
• Pay From Schedule (32)
• Exceptions (24)
• Punch Rows (19)
• Comments & Notes (16)
• Accruals Add-on (12)
• Miscellaneous (4)
{panel}
{column}

{column:width=33%}
{panel:title=✅ Group Edits & Approvals (32 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#E8F5E9|bgColor=#F5F5F5}
• Approval Actions (12)
• Enable Edits (8)
• Timekeeping Actions (8)
• Payroll Lock (4)
{panel}
{column}

{column:width=33%}
{panel:title=⚙️ Configuration & Setup (58 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#FFF3E0|bgColor=#F5F5F5}
• Pay Codes (19)
• Timecard Config (16)
• Wage & Work Rules (12)
• Rule Analysis Tool (11)
{panel}
{column}
{section}

{section}
{column:width=50%}
{panel:title=🧭 Navigation & Views (42 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#F3E5F5|bgColor=#F5F5F5}
• Timecard Navigation (15)
• Project Timecard (11)
• Print View (8)
• List View (8)
{panel}
{column}

{column:width=50%}
{panel:title=📋 Other Areas (33 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#FCE4EC|bgColor=#F5F5F5}
• Schedule Integration (12)
• Overtime Management (7)
• Missing Time (6)
• Audits Add-on (4)
• Transfers (4)
{panel}
{column}
{section}

*Total: 310 tests* (145 + 32 + 58 + 42 + 33)

----

h2. Test Execution Guidelines

h3. Prerequisites
# Node.js (v18 or higher)
# Playwright installed
# Environment variables configured in {{.env}} file
# Valid API authentication token

h3. Running Tests Locally

*All Handover Tests:*
{code:bash}
npx playwright test --grep @handover
{code}

*By Priority:*
{code:bash}
# P1 tests only
npx playwright test --grep "@handover.*@P1"

# P2/P3 tests only
npx playwright test --grep "@handover" --grep-invert "@P1"
{code}

*By Team:*
{code:bash}
# Dyna team tests
npx playwright test --grep "@handover.*@team:Dyna"

# Kepler team tests
npx playwright test --grep "@handover.*@team:Kepler"
{code}

h3. Running Tests via GitHub Actions

Tests are executed automatically via GitHub Actions CI/CD pipeline using GARM cloud runners.

*Triggering a Test Run:*

# Navigate to the repository: [https://github.com/UKGEPIC/tk-ui-tests]
# Go to the *Actions* tab
# Select the appropriate workflow (e.g., "Playwright Tests - Handover")
# Click *Run workflow* button on the right
# Select parameters:
   * *Branch:* Choose the branch (e.g., {{r9int/playwright-tests}})
   * *Environment:* Select target environment (e.g., {{r9int}})
   * *Test Filter:* Optionally specify test tags (e.g., {{@handover}}, {{@P1}})
# Click *Run workflow* to start execution

*Workflow Features:*
* Fresh GARM runner provisioned for each execution
* Parallel test execution across multiple workers
* Automatic artifact upload (test reports, screenshots, videos)
* Real-time logs available in the Actions run
* Results automatically published to FACT dashboard

{info}*Tip:* You can also trigger workflows via GitHub CLI: {{gh workflow run "workflow-name.yml" --ref branch-name}}{info}

----

h2. Test Reporting

All test execution results are reported to FACT (Framework for Automated Continuous Testing), similar to the previous Selenium test reporting infrastructure.

h3. FACT Dashboard
* *Dashboard URL:* [http://fact03-timekeeping.ukg.int:3000/execution;type=UI;product=K8S_Timekeeping_Playwright;team=playwright_handover;range=20;browser=chrome]

h3. Reporting Configuration

|| Parameter || Value || Description ||
| *Type* | UI | Test execution type |
| *Product* | K8S_Timekeeping_Playwright | Product identifier for Playwright tests |
| *Team* | playwright_handover | Team identifier for handover tests |
| *Range* | 20 | Number of recent executions to display |
| *Browser* | chrome | Default browser for execution |

{info}*Note:* Test results are automatically published to FACT after each test execution. Historical trends, pass rates, and failure analysis are available on the dashboard.{info}

----

h2. CSV Report Details

The {{handover_tests_report.csv}} file contains detailed information about each test:

|| Column || Description ||
| *TestName* | Unique test identifier (ALM/TR number + description) |
| *Priority* | Test priority (P1 or P2/P3) |
| *Team* | Owning team name |
| *User* | Developer who created/maintains the test |
| *FilePath* | Full Windows path to the test file |

h3. Sample CSV Entries
{code}
"TestName","Priority","Team","User","FilePath"
"test_ALM249311_PFSIsCancelAssignmentIsNo.spec","P1","Dyna","Vikash","C:\...\test_ALM249311_PFSIsCancelAssignmentIsNo.spec.ts"
"test_ALM125208_TimecardHourlyConfigurationVerifyColumnsVisibilityAndSortOrder.spec","P1","Wizards","Nitesh","C:\...\test_ALM125208_TimecardHourlyConfigurationVerifyColumnsVisibilityAndSortOrder.spec.ts"
{code}

----

h2. Maintenance & Support

h3. Known Items
* All tests have been verified to have proper {{@handover}} tags
* Tests previously marked with {{@flaky}} have had that tag removed
* One duplicate entry was removed from the CSV during handover process

h3. Contact Information
For questions or issues with specific tests, refer to the *User* column in the CSV report to identify the original developer.

h3. Test Maintenance Guidelines
# *Do not remove* the {{@handover}} tag from these tests
# Update the CSV if tests are moved or renamed
# Maintain priority tags ({{@P1}}) for accurate reporting
# Keep team and user tags ({{@team:}}, {{@user:}}) for traceability

----

h2. Next Steps

* *Additional 280 test cases* planned for conversion in the next phase
* *Target: 590 total Playwright test cases* covering comprehensive TK functionality
* Continued focus on high-priority and frequently failing Selenium tests
* Progressive handover as batches are completed and validated
* *Enhanced Parallel Execution:* Current tests run in parallel, with opportunities to further optimize execution time by dividing workflows across multiple workers for faster feedback

{info}*Future Phases:* The remaining 280 cases will follow the same conversion and validation process, with continued focus on pipeline optimization.{info}

----

h2. Change History

|| Date || Version || Changes || Author ||
| March 12, 2026 | 1.0 | Initial handover - 310 tests | Development Team |

----

h2. Appendices

h3. Appendix A: Quick Reference Commands

{code:bash}
# Count handover tests
grep -r "@handover" tests/ | wc -l

# List all P1 handover tests
grep -r "@handover" tests/ | grep "@P1"

# Generate test report
npx playwright test --grep @handover --reporter=html

# Run tests in headed mode for debugging
npx playwright test --grep @handover --headed

# Run specific team's tests
npx playwright test --grep "@handover.*@team:Dyna"
{code}

----

h2. Notes
* All 310 tests have been committed to the {{feature/playwright-handover}} branch
* The handover CSV report is version-controlled alongside the tests
* Tests are ready for immediate execution and maintenance by the client team
* Recommend running P1 tests as part of regression suite before each release

