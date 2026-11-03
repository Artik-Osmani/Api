# Presentation checklist

[Open the short code guide](../README.md) · [Full technical reference](TECHNICAL_REFERENCE.md) · [Verification evidence](VERIFICATION.md)

## Does the project fit the assignment?

Yes, it provides real features to demonstrate and explain: navigation, search, stay details, booking, Saved, hosts, messages and an API. The previous verification recorded 73 passing tests and a build with zero warnings. Those results describe the code, not completion of the teamwork assignment.

The [Classroom post](https://classroom.google.com/u/0/c/ODc3MDAyMDg3NDQ0) says each member, not only the TeamLead, must explain exactly what they worked on. The supplied Day 4 guide requires Jira tickets, individual branches and PRs, review, merge and submission links.

## Prepare the evidence

- [ ] Open the existing Jira board. Show at least four clear tasks with assignees and acceptance criteria.
- [ ] Each member identifies their own task and explains their actual contribution.
- [ ] Show the matching branch, commits and PR for each member.
- [ ] Show the review comment or approval and the merged result.
- [ ] Add the PR link and a short test result to the Jira ticket.
- [ ] Move a ticket to Done only after its work was reviewed, merged and checked.
- [ ] Submit the Jira board, GitHub repository, ticket IDs and PR links with access for the professor.

Local Git history contains merged PRs including #2, #3, #4, #5, #6 and #8, plus branches named with SCRUM ticket IDs. This supports that the group has used branches and PRs. It does not establish that each current member has a reviewed PR or a completed Jira ticket. Jira statuses and review approvals were not verified.

The upgrade work was on the local `upgrade/ui` branch when this guide was written. A local commit is not proof of a published, reviewed or merged PR. Check GitHub before presenting a change as merged.

Two concrete examples from commits authored as Dalmat in the local history:

| Ticket / work | Commit | Related merge in history |
| --- | --- | --- |
| SCRUM-10, contact page | `2c2ac53` | [PR #3](https://github.com/Artik-Osmani/Api/pull/3) |
| SCRUM-8, FatiHomes logo | `f573f56` | [PR #2](https://github.com/Artik-Osmani/Api/pull/2) |

Use these if they match your Jira assignments. Show the actual changes in those commits; the current design has since been updated. Review approvals and Jira completion still need to be checked in the corresponding services.

## A short demonstration

1. Run `dotnet run` and open [the website](http://localhost:5047/).
2. Show the navbar, hero and footer. Use the matching links in the README to open their code.
3. Search for Prizren and open a stay. Show how `api.js` calls `ListingsController` and how the search service filters data.
4. Walk through a demo booking. Show `PricingCalculator` for the total and `ReservationRules` for overlap and status checks.
5. Finish with your own Jira ticket and PR: what you changed, how you tested it and who reviewed it.

## Useful answers

- **Where does the page come from?** `wwwroot/index.html` contains the shell; the modules in `wwwroot/js/views/` build each view.
- **Where is the design?** `wwwroot/css/`, with colours and fonts in `tokens.css`.
- **Where is the API?** `Controllers/`; its interactive documentation is at `/swagger`.
- **Where is the data?** `SeedData.cs` creates it and `MockDataStore.cs` holds it in memory.
- **Is payment real?** No. It is a course demo, with no authentication or payment provider.
- **What did you personally do?** Explain your actual changes and show the corresponding ticket, commit and PR. Do not claim another member's work.
