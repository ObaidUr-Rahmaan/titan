# Titan

Easy-to-setup, fully-featured, and customizable NextJS 15 Boilerplate.

## Tech Stack

- [NextJS 15](https://nextjs.org/) - Full-Stack React framework
- [Supabase](https://supabase.com/) - Database Provider
- [Drizzle](https://drizzle.dev/) - ORM (TypeScript-first)
- [Clerk](https://clerk.com/) - Authenticate your users (ban, impersonate etc.)
- [Stripe](https://stripe.com/) - Collect Payments
- [Plunk](https://useplunk.com/) - Send Emails Programmatically
- [Upstash](https://upstash.com/) - Redis for rate limiting
- [DataFast](https://datafa.st/) - User Analytics for Actionable Growth (Know exactly which marketing channels are working)
- [UserJot](https://userjot.com/) - User Feedback/Bug-Reports and Product Roadmap
- [GetFernand](https://getfernand.com/) - Fast, Calm Customer Support
- [Vercel](https://vercel.com/) - Deployments without worrying about infrastructure (DDoS protection, etc.)

## Titan Upgrade Workflows

Titan includes bi-directional intelligent upgrade systems for continuous improvement.

### 🔄 Two-Way Upgrade System

#### **Upstream**: Improve Titan from evolved projects (For Creator-use only)
Extract battle-tested improvements from mature projects back to Titan boilerplate.

#### **Downstream**: Upgrade projects with latest Titan (For Titan users)
Apply latest Titan improvements to existing projects safely and selectively.

### Upstream: Analyze Evolved Projects → Improve Titan

**Quick Start via Script**:
```bash
# Automated setup via script
bun scripts/upgrade-titan.ts --project-path ./evolved-projects/my-saas-app

# Or via interactive prompt
bun run upgrade-titan
```

**Manual Setup**:
1. **Clone your evolved project** into the Titan workspace:
   ```bash
   mkdir evolved-projects
   git clone <your-evolved-saas-project> ./evolved-projects/my-saas-app
   ```

2. **Create a project-specific PRD** for the analysis:
   ```bash
   cp docs/titan-upgrade-prd-template.txt .taskmaster/docs/prd.txt
   # Edit the PRD to replace [PROJECT_NAME], [TIME_SPAN], etc. with your project details
   ```

3. **Start the analysis** with Cursor:
   ```
   "Analyze my-saas-app for Titan upgrades using the PRD"
   ```

### Downstream: Upgrade Your Project with Latest Titan

**Quick Start via Script** (Recommended):
```bash
# From your Titan-based project directory
bun scripts/upgrade-project.ts

# Conservative upgrade focusing on security
bun scripts/upgrade-project.ts --risk-tolerance conservative --domains security,performance

# Dry run to preview changes
bun scripts/upgrade-project.ts --dry-run
```

**Manual Setup**:
1. **Ensure clean repository** (all changes committed):
   ```bash
   git status  # Should be clean
   ```

2. **Create project upgrade PRD**:
   ```bash
   cp docs/project-upgrade-prd-template.txt .taskmaster/docs/prd.txt
   # Edit PRD with your project details and risk tolerance
   ```

3. **Start the upgrade** with Cursor:
   ```
   "Upgrade my project to latest Titan using the PRD"
   ```

**Safety Features**:
- 🛡️ Creates `upgrade/titan-latest` branch for all changes
- 🔄 Easy rollback: `git checkout main && git branch -D upgrade/titan-latest`
- 📊 Intelligent compatibility assessment
- ⚠️ Never overwrites custom business logic

### Analysis Domains

Both workflows systematically analyze **20 domains** including:
- **Core Infrastructure**: Authentication, payments, database, email systems
- **Development Experience**: Scripts, components, configuration, testing
- **Quality & Performance**: Error handling, security, optimization, monitoring  
- **User Experience**: UX patterns, analytics, mobile responsiveness
- **Integrations**: APIs, background jobs, SEO, third-party services
- **Titan-Specific**: CLI improvements, utility patterns, app structure

### Safety-First Approach

All upgrades follow strict **compatibility and safety** rules:

#### **Upstream (To Titan)**:
- ✅ Add new features as opt-in enhancements
- ✅ Maintain existing API interfaces  
- ✅ Progressive enhancement approach
- ❌ Never break existing functionality

#### **Downstream (To Projects)**:
- ✅ Selective application based on project needs
- ✅ Branch-based upgrades with easy rollback
- ✅ Incremental testing after each domain
- ❌ Never overwrite custom business logic

### How Both Workflows Work

**Upstream (Titan Improvement)**:
1. **Domain Analysis**: Compare evolved project vs current Titan across all domains
2. **Improvement Extraction**: Identify specific code improvements and optimizations  
3. **Migration Planning**: Create safe migration tasks with compatibility assessment
4. **Implementation**: Apply improvements while maintaining backward compatibility

**Downstream (Project Upgrade)**:
1. **Compatibility Assessment**: Compare current project vs latest Titan
2. **Selective Application**: Only apply relevant and safe improvements
3. **Safe Implementation**: Branch-based upgrades with incremental testing
4. **Validation**: Comprehensive testing before merge or rollback

### Documentation

- **Upstream**: [`.cursor/rules/titan-upgrade-workflow.mdc`](.cursor/rules/titan-upgrade-workflow.mdc)
- **Downstream**: [`.cursor/rules/project-upgrade-workflow.mdc`](.cursor/rules/project-upgrade-workflow.mdc)
- **Compatibility**: [`.cursor/rules/upgrade-compatibility.mdc`](.cursor/rules/upgrade-compatibility.mdc)
- **Safety Patterns**: [`.cursor/rules/upgrade-safety-patterns.mdc`](.cursor/rules/upgrade-safety-patterns.mdc)

---

Detailed Docs [here](https://blueprint.codeandcreed.tech/product-development/titan)
