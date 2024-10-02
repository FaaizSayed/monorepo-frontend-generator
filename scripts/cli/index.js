#!/usr/bin/env node

const inquirer = require('inquirer');
const execa = require('execa');
const fs = require('fs');
const path = require('path');

async function main() {
  // Step 1: Prompt for Project Name
  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Enter the project name:',
      validate: (input) => !!input || 'Project name cannot be empty',
    },
  ]);

  // Step 2: Choose Framework
  const { framework } = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Select a framework/library:',
      choices: ['React', 'Vue', 'Solid', 'Remix', 'Next.js'],
    },
  ]);

  // Step 3: Choose Language
  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Select the language:',
      choices: ['JavaScript', 'TypeScript'],
    },
  ]);

  // Step 4: Ask for ESLint
  const { useESLint } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useESLint',
      message: 'Do you want to include ESLint for code linting?',
      default: false,
    },
  ]);

  // Step 5: Framework-specific Options
  let reactOptions = {};
  if (framework === 'React') {
    // Ask for React Router
    const { includeReactRouter } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'includeReactRouter',
        message: 'Do you want to include React Router?',
        default: false,
      },
    ]);

    // Ask for State Management
    const { useStateManagement } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useStateManagement',
        message: 'Do you need state management?',
        default: false,
      },
    ]);

    let stateManagementLib = null;
    if (useStateManagement) {
      const { stateManagementLibrary } = await inquirer.prompt([
        {
          type: 'list',
          name: 'stateManagementLibrary',
          message: 'Select a state management library:',
          choices: ['Redux Toolkit', 'Redux Saga', 'Zustand', 'MobX', 'None'],
        },
      ]);
      stateManagementLib = stateManagementLibrary;
    }

    reactOptions = {
      includeReactRouter,
      useStateManagement,
      stateManagementLib,
    };
  }

  // Step 6: Choose CSS Frameworks
  const { cssFrameworks } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'cssFrameworks',
      message: 'Select CSS frameworks/libraries:',
      choices: ['Tailwind CSS', 'Sass', 'Less', 'Styled Components'],
    },
  ]);

  // Step 7: Set Up the Project
  await setupProject({
    projectName,
    framework,
    language,
    cssFrameworks,
    useESLint,
    reactOptions,
  });
}

async function setupProject(options) {
  const {
    projectName,
    framework,
    language,
    cssFrameworks,
    useESLint,
    reactOptions,
  } = options;

  const packagesDir = path.resolve(__dirname, '../../packages');
  const projectDir = path.join(packagesDir, projectName);

  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });

  console.log(`Creating project ${projectName} with ${framework} in ${language}...`);

  try {
    switch (framework) {
      case 'React':
        await createReactApp(projectDir, language, reactOptions, useESLint);
        break;
      case 'Vue':
        await createVueApp(projectDir, language, useESLint);
        break;
      case 'Solid':
        await createSolidApp(projectDir, language, useESLint);
        break;
      case 'Remix':
        await createRemixApp(projectDir, language, useESLint);
        break;
      case 'Next.js':
        await createNextApp(projectDir, language, useESLint);
        break;
      default:
        console.error('Unsupported framework');
        process.exit(1);
    }

    // Install CSS Frameworks
    await installCssFrameworks(projectDir, cssFrameworks, language);

    console.log('Project setup complete.');
  } catch (error) {
    console.error('Error setting up project:', error);
  }
}

async function createReactApp(projectDir, language, reactOptions, useESLint) {
  const template = language === 'TypeScript' ? '--template typescript' : '';
  await execa.command(`npx create-react-app ${projectDir} ${template}`, { stdio: 'inherit', shell: true });

  // Navigate to project directory
  process.chdir(projectDir);

  const dependencies = [];
  const devDependencies = [];

  // Install React Router if selected
  if (reactOptions.includeReactRouter) {
    dependencies.push('react-router-dom');
    if (language === 'TypeScript') {
      devDependencies.push('@types/react-router-dom');
    }
  }

  // Install State Management Library if selected
  if (reactOptions.useStateManagement && reactOptions.stateManagementLib !== 'None') {
    switch (reactOptions.stateManagementLib) {
      case 'Redux Toolkit':
        dependencies.push('@reduxjs/toolkit', 'react-redux');
        if (language === 'TypeScript') {
          devDependencies.push('@types/react-redux');
        }
        break;
      case 'Redux Saga':
        dependencies.push('redux', 'redux-saga', 'react-redux');
        if (language === 'TypeScript') {
          devDependencies.push('@types/react-redux');
        }
        break;
      case 'Zustand':
        dependencies.push('zustand');
        break;
      case 'MobX':
        dependencies.push('mobx', 'mobx-react');
        break;
      default:
        break;
    }
  }

  // Install ESLint if selected
  if (useESLint) {
    devDependencies.push('eslint');
    // You can add more ESLint plugins or configs based on preferences
  }

  if (dependencies.length > 0) {
    console.log('Installing additional dependencies...');
    await execa.command(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit', shell: true });
  }

  if (devDependencies.length > 0) {
    console.log('Installing additional devDependencies...');
    await execa.command(`npm install -D ${devDependencies.join(' ')}`, { stdio: 'inherit', shell: true });
  }
}

async function createVueApp(projectDir, language, useESLint) {
  const template = language === 'TypeScript' ? '--template vue-ts' : '--template vue';
  await execa.command(`npm init vite@latest ${projectDir} ${template}`, { stdio: 'inherit', shell: true });
  await execa.command(`cd ${projectDir} && npm install`, { stdio: 'inherit', shell: true });

  // Navigate to project directory
  process.chdir(projectDir);

  // Install ESLint if selected
  if (useESLint) {
    console.log('Installing ESLint...');
    await execa.command('npm install -D eslint', { stdio: 'inherit', shell: true });
    // Additional ESLint setup can be added here
  }
}

async function createSolidApp(projectDir, language, useESLint) {
  const template = language === 'TypeScript' ? 'ts' : 'js';
  await execa.command(`npx degit solidjs/templates/${template} ${projectDir}`, { stdio: 'inherit', shell: true });
  await execa.command(`cd ${projectDir} && npm install`, { stdio: 'inherit', shell: true });

  // Navigate to project directory
  process.chdir(projectDir);

  // Install ESLint if selected
  if (useESLint) {
    console.log('Installing ESLint...');
    await execa.command('npm install -D eslint', { stdio: 'inherit', shell: true });
    // Additional ESLint setup can be added here
  }
}

async function createRemixApp(projectDir, language, useESLint) {
  const args = language === 'TypeScript' ? '--typescript' : '';
  await execa.command(`npx create-remix@latest ${projectDir} ${args}`, { stdio: 'inherit', shell: true });

  // Navigate to project directory
  process.chdir(projectDir);

  // Install ESLint if selected
  if (useESLint) {
    console.log('Installing ESLint...');
    await execa.command('npm install -D eslint', { stdio: 'inherit', shell: true });
    // Additional ESLint setup can be added here
  }
}

async function createNextApp(projectDir, language, useESLint) {
  const args = language === 'TypeScript' ? '--typescript' : '';
  await execa.command(`npx create-next-app@latest ${projectDir} ${args}`, { stdio: 'inherit', shell: true });

  // Navigate to project directory
  process.chdir(projectDir);

  // Install ESLint if selected
  if (useESLint) {
    console.log('Installing ESLint...');
    await execa.command('npm install -D eslint', { stdio: 'inherit', shell: true });
    // Additional ESLint setup can be added here
  }
}

async function installCssFrameworks(projectDir, cssFrameworks, language) {
  if (cssFrameworks.length === 0) return;

  console.log('Installing CSS frameworks...');
  const devDependencies = [];
  const dependencies = [];

  // Navigate to project directory
  process.chdir(projectDir);

  if (cssFrameworks.includes('Tailwind CSS')) {
    devDependencies.push('tailwindcss', 'postcss', 'autoprefixer');
    await execa.command('npx tailwindcss init -p', { stdio: 'inherit', shell: true });
    // Additional Tailwind CSS setup can be added here
  }

  if (cssFrameworks.includes('Sass')) {
    devDependencies.push('sass');
  }

  if (cssFrameworks.includes('Less')) {
    devDependencies.push('less');
  }

  if (cssFrameworks.includes('Styled Components')) {
    dependencies.push('styled-components');
    if (language === 'TypeScript') {
      devDependencies.push('@types/styled-components');
    }
  }

  if (devDependencies.length > 0) {
    await execa.command(`npm install -D ${devDependencies.join(' ')}`, { stdio: 'inherit', shell: true });
  }

  if (dependencies.length > 0) {
    await execa.command(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit', shell: true });
  }
}

main();
