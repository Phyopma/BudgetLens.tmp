# BudgetLens - Personal Finance Dashboard (Personal Fork)

This is my personal fork of the [BudgetLens](https://github.com/cbangera2/BudgetLens) project where I'm making customizations to fit my specific needs. This repository is maintained for my personal use only.

## Original Project

The original BudgetLens project was created by [cbangera2](https://github.com/cbangera2/BudgetLens). Please visit the original repository for the official version:

[https://github.com/cbangera2/BudgetLens](https://github.com/cbangera2/BudgetLens)

## My Customizations

Here's what I've added/modified from the original codebase:

1. **Enhanced AccountBalanceCards component**:

   - Added better balance display formatting
   - Improved error handling for bank accounts with no balance data
   - Added tooltips for better user guidance

2. **Improved Bank Account Management**:

   - Added additional account types and fields for better tracking
   - Enhanced the account editing interface
   - Improved form validation for account details
   - Added confirmation dialogs for important actions

3. **UI/UX Improvements**:

   - Customized color scheme to suit my preferences
   - Made card layouts more consistent across different screen sizes
   - Added visual indicators for account balance trends

4. **User Authentication System**:

   - Implemented secure login and registration flows
   - Enabled OAuth integration with Email Credential

5. **CSV Import Enhancements**:

   - Fixed CSV parser issues for better compatibility with various formats
   - Added duplicate transaction detection to prevent double-counting
   - Implemented smart category matching based on transaction descriptions
   - Added batch import/export functionality

6. **Sharing & Collaboration Features**:

   - Added ability to invite users to view/edit financial data
   - Implemented granular permission settings for shared dashboards
     <!-- - Created notification system for shared activity -->
     <!-- - Added comment functionality on transactions -->

7. **Advanced Account Balance Tracking**:
   - Added historical balance trending with visualization
     <!-- - Implemented predictive balance forecasting -->
     <!-- - Created alerts for unusual account activity -->
     <!-- - Added support for multiple currencies with conversion -->

## Installation Options

You can set up this project using either the local development method or Docker (recommended).

### Option 1: Local Development Setup

1. **Prerequisites**:

   - Node.js 18+
   - PostgreSQL
   - npm or yarn

2. **Clone this repository**:

   ```bash
   git clone [your-fork-url]
   cd BudgetLens
   ```

3. **Setup Environment**:

   - Create a `.env` file based on `.env_example`
   - Configure your database connection

4. **Install dependencies and setup database**:

   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

### Option 2: Docker Deployment (Recommended)

1. **Prerequisites**:

   - Docker
   - Docker Compose

2. **Clone this repository**:

   ```bash
   git clone [your-fork-url]
   cd BudgetLens
   ```

3. **Build and Run with Docker**:
   ```bash
   docker compose up --build
   ```

## Disclaimer

This fork is maintained solely for my personal use and learning. All credit for the original codebase goes to the original authors. If you're interested in using BudgetLens, I recommend checking out the official repository.
