h1. Test Automation Handover 2 - Playwright Tests

h2. Overview
This is the second phase of our Playwright test handover, continuing the migration of critical UI test cases from Selenium to Playwright. This batch focuses on additional timecard, transfer, and configuration tests with enhanced stability.

----

h2. Current State

* *160 test cases* successfully converted from Selenium to Playwright in this phase
* *310 test cases* from previous handover (Phase 1) tagged with {{@handover}}
* *Total: 470 Playwright tests* across both handovers
* All Phase 2 tests tagged with {{@handover2}} for easy identification
* Tests validated and stabilized on target environment
* CSV report with team assignments provided
* CI/CD pipeline execution via GitHub Actions

----

h2. Repository Information

h3. Test Repository
* *Repository:* UKGEPIC/tk-ui-tests
* *Branch:* feature/playwright-handover
* *CSV Report:* {{test_cases_verification.csv}}

----

h2. Test Distribution by Team

|| Team || P1 Tests || P2/P3 Tests || Total ||
| Dyna | 12 | 3 | 15 |
| Elves | 1 | 0 | 1 |
| Innovance | 4 | 1 | 5 |
| Kepler | 9 | 3 | 12 |
| PathFinders | 7 | 1 | 8 |
| Patriots | 44 | 10 | 54 |
| Quest | 51 | 2 | 53 |
| Tidal | 3 | 5 | 8 |
| Wizards | 0 | 4 | 4 |
| *Total* | *131* | *29* | *160* |

----

h2. Test Categories

The handed-over tests cover the following major functional areas:

{section}
{column:width=33%}
{panel:title=🔄 Transfers & Configuration (51 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#E3F2FD|bgColor=#F5F5F5}
• Transfers (39)
• Timecard Configuration (5)
• Setup (5)
• Rules Analysis (2)
{panel}
{column}

{column:width=33%}
{panel:title=✅ Approval & Timecard (37 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#E8F5E9|bgColor=#F5F5F5}
• Approval & Signoff (20)
• Project Timecard (14)
• Punch (3)
{panel}
{column}

{column:width=33%}
{panel:title=⚙️ Timecard Operations (32 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#FFF3E0|bgColor=#F5F5F5}
• Timeframe Selection (12)
• Move Amount (10)
• PayCodes (9)
• Audits (1)
{panel}
{column}
{section}

{section}
{column:width=50%}
{panel:title=🔍 Views & Validation (20 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#F3E5F5|bgColor=#F5F5F5}
• Group Edits (7)
• Timecard View (6)
• List View (4)
• Business Validation (3)
{panel}
{column}

{column:width=50%}
{panel:title=📋 Other Areas (20 tests)|borderStyle=solid|borderColor=#ccc|titleBGColor=#FCE4EC|bgColor=#F5F5F5}
• Exceptions (9)
• Overtime (4)
• Enable Edits (2)
• Multiple Positions (1)
• Corrections (1)
• Comments & Notes (1)
• Access (1)
• Other (1)
{panel}
{column}
{section}

*Total: 160 tests* (51 + 37 + 32 + 20 + 20)

----

h2. Running Tests

h3. All Handover2 Tests
{code:bash}
npx playwright test --grep @handover2
{code}

h3. By Priority
{code:bash}
# P1 tests only
npx playwright test --grep "@handover2.*@P1"

# P2/P3 tests only
npx playwright test --grep "@handover2.*@P2|@handover2.*@P3"
{code}

h3. By Team
{code:bash}
# Quest team tests (53 tests)
npx playwright test --grep "@handover2.*@team:Quest"

# Patriots team tests (54 tests)
npx playwright test --grep "@handover2.*@team:Patriots"

# Dyna team tests (15 tests)
npx playwright test --grep "@handover2.*@team:Dyna"
{code}

h3. By User
{code:bash}
# Ayushi's tests
npx playwright test --grep "@handover2.*@user:Ayushi"

# Naman's tests
npx playwright test --grep "@handover2.*@user:Naman"
{code}

----

h2. CSV Report Details

The {{test_cases_verification.csv}} file contains:

|| Column || Description ||
| *S.No* | Serial number |
| *TestName* | Unique test identifier |
| *Component* | Test component/folder name |
| *Priority* | P1 or P2/P3 |
| *Team* | Owning team |
| *User* | Test owner/maintainer |
| *FilePath* | Relative path to test file |

----

h2. Test Execution via GitHub Actions

*Triggering Handover2 Tests:*

# Navigate to [https://github.com/UKGEPIC/tk-ui-tests]
# Go to *Actions* tab
# Select Playwright workflow
# Click *Run workflow*
# Parameters:
   * *Branch:* {{feature/playwright-handover}}
   * *Test Filter:* {{@handover2}}
   * *Priority Filter:* {{@P1}} (optional)
# Click *Run workflow*

Results automatically published to FACT dashboard.

----

h2. FACT Dashboard

* *Dashboard URL:* [http://fact03-timekeeping.ukg.int:3000/execution;type=UI;product=K8S_Timekeeping_Playwright;team=playwright_handover2]

|| Parameter || Value ||
| Type | UI |
| Product | K8S_Timekeeping_Playwright |
| Team | playwright_handover2 |
| Browser | chrome |

----

h2. Maintenance Guidelines

# Maintain {{@handover2}} tag on all tests
# Update CSV when tests are moved/renamed
# Keep priority, team, and user tags accurate
# Reference CSV for test ownership

----

h2. Next Steps

* *130 additional test cases* planned for conversion by March 30, 2026 (Phase 3)
* *Target: 600 total Playwright test cases* covering comprehensive TK functionality
* Focus on remaining high-priority and frequently failing Selenium tests
* Progressive handover as Phase 3 batch is completed and validated
* Final handover will include complete test coverage across all critical areas

{info}*Phase 3 Timeline:* The remaining 130 cases will follow the same conversion and validation process, targeted for completion by March 30, 2026.{info}

----

h2. Change History

|| Date || Version || Changes ||
| March 23, 2026 | 1.0 | Initial handover2 - 160 tests |

----

h2. Notes

* Tests committed to {{feature/playwright-handover}} branch
* CSV report version-controlled with tests
* Ready for immediate execution
* Total Playwright tests across both handovers: *470 tests* (310 + 160)
