# Quick Setup Guide for Empower-Social Repository

## 📦 Files to Upload

Make sure you have these files ready:
- ✅ README.md
- ✅ LICENSE
- ✅ .gitignore
- ✅ intake-survey.html
- ✅ recommendations-mockup.html
- ✅ EMPOWER_SYSTEM_GUIDE.md
- ✅ SETUP_GUIDE.md (optional - for your reference)

---

## 🚀 Step-by-Step Upload Instructions

### Step 1: Prepare Your Files

1. Create a folder on your computer called `Empower-Social`
2. Download all files from Claude and put them in this folder
3. Open a terminal/command prompt in this folder

**IMPORTANT:** This is a private repository for your company. Keep your API keys and credentials secure!

### Step 2: Initialize Git

```bash
# Navigate to your project folder
cd Empower-Social

# Initialize git repository
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: Empower MVP with survey and prompt generation"
```

### Step 3: Connect to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/empowersocialapp/Empower-Social.git

# Set main as default branch
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## 🎨 Optional: Customize Before Uploading

### In README.md, update:
- Line 142: `**Creator:** [Your Name]` → Add your name
- Line 144-147: Add your contact info (email, LinkedIn, Twitter)

### In intake-survey.html:
- Everything is ready to go! No changes needed.

---

## ✅ Verify Upload

After pushing, visit:
https://github.com/empowersocialapp/Empower-Social

You should see:
- ✅ Beautiful README with project description
- ✅ All files uploaded
- ✅ Green badges at the top
- ✅ Professional formatting

---

## 🌟 Make Your Repo Stand Out

### Add Repository Description
1. Go to your repo on GitHub
2. Click the gear icon (⚙️) next to "About"
3. Add description: "AI-powered event recommendation platform for Empower Social (Private)"
4. Add topics: `event-recommendation`, `psychology`, `ai`, `gpt-4`, `personality-assessment`
5. Save changes

### Repository Settings
Since this is a private company repository:
- ✅ Keep repository **Private**
- ✅ Only invite team members who need access
- ✅ Enable branch protection rules for `main` branch
- ✅ Require pull request reviews before merging
- ❌ Do NOT enable GitHub Pages (private code should not be public)

---

## 🔧 Common Issues

### "Permission denied (publickey)"
Solution: Set up SSH keys or use HTTPS
```bash
# Use HTTPS instead
git remote set-url origin https://github.com/empowersocialapp/Empower-Social.git
```

### "Repository not found"
Solution: Make sure you created the repo on GitHub first
1. Go to github.com/empowersocialapp
2. Click "New repository"
3. Name it exactly: `Empower-Social`
4. Don't initialize with README (you already have one)
5. Create repository
6. Then run the git commands

### Files won't add
Solution: Make sure you're in the right directory
```bash
# Check current directory
pwd

# List files
ls

# Should see: README.md, intake-survey.html, etc.
```

---

## 📝 Next Steps After Upload

1. **Test the live site** (if you enabled GitHub Pages)
2. **Share the repo link** with potential collaborators
3. **Add to your portfolio/LinkedIn**
4. **Continue development** with new branches:
   ```bash
   git checkout -b feature/database-integration
   # Make changes
   git add .
   git commit -m "Add Airtable integration"
   git push origin feature/database-integration
   ```

---

## 💡 Quick Git Commands Reference

```bash
# Check status
git status

# Add specific file
git add filename.html

# Add all files
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# Pull latest changes
git pull

# Create new branch
git checkout -b branch-name

# Switch branches
git checkout main
```

---

## 🎯 Your Repository URLs

- **Main repo:** https://github.com/empowersocialapp/Empower-Social
- **Issues:** https://github.com/empowersocialapp/Empower-Social/issues
- **Live site (if Pages enabled):** https://empowersocialapp.github.io/Empower-Social/

---

Good luck! 🚀 Your project is ready to share with the world!
