/**
 * Progress Tracker for Visual Regression Tests
 * Provides real-time terminal updates with timing information
 */

const chalk = require('chalk')

class ProgressTracker {
  constructor() {
    this.startTime = Date.now()
    this.currentTask = null
    this.taskStartTime = null
    this.completedTasks = []
    this.failedTasks = []
    this.spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    this.spinnerIndex = 0
    this.spinnerInterval = null
  }

  startTask(taskName, description = '') {
    this.currentTask = {
      name: taskName,
      description,
      startTime: Date.now(),
    }
    this.taskStartTime = Date.now()

    // Clear previous spinner
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval)
    }

    // Start new spinner
    this.spinnerInterval = setInterval(() => {
      this.updateProgress()
    }, 100)

    this.updateProgress()
  }

  updateProgress() {
    if (!this.currentTask) return

    const elapsed = Date.now() - this.currentTask.startTime
    const totalElapsed = Date.now() - this.startTime
    const spinner = this.spinner[this.spinnerIndex % this.spinner.length]
    this.spinnerIndex++

    // Clear line and write progress
    process.stdout.write('\r\x1b[K') // Clear line
    process.stdout.write(
      `${spinner} ${chalk.cyan(this.currentTask.name)} ` +
        `${chalk.gray(this.currentTask.description)} ` +
        `${chalk.yellow(this.formatTime(elapsed))} ` +
        `${chalk.gray(`(Total: ${this.formatTime(totalElapsed)})`)}`
    )

    // Check for timeout
    if (elapsed > 60000) {
      this.failTask('Timeout: Task exceeded 60 seconds')
      throw new Error(
        `Task '${this.currentTask.name}' exceeded 60-second timeout`
      )
    }
  }

  completeTask(result = {}) {
    if (!this.currentTask) return

    clearInterval(this.spinnerInterval)
    const elapsed = Date.now() - this.currentTask.startTime

    this.completedTasks.push({
      ...this.currentTask,
      endTime: Date.now(),
      elapsed,
      result,
    })

    // Clear line and show completion
    process.stdout.write('\r\x1b[K')
    console.log(
      `${chalk.green('✓')} ${chalk.green(this.currentTask.name)} ` +
        `${chalk.gray(this.currentTask.description)} ` +
        `${chalk.green(this.formatTime(elapsed))}`
    )

    if (result.message) {
      console.log(`  ${chalk.gray('→')} ${result.message}`)
    }

    this.currentTask = null
  }

  failTask(error) {
    if (!this.currentTask) return

    clearInterval(this.spinnerInterval)
    const elapsed = Date.now() - this.currentTask.startTime

    this.failedTasks.push({
      ...this.currentTask,
      endTime: Date.now(),
      elapsed,
      error,
    })

    // Clear line and show failure
    process.stdout.write('\r\x1b[K')
    console.log(
      `${chalk.red('✗')} ${chalk.red(this.currentTask.name)} ` +
        `${chalk.gray(this.currentTask.description)} ` +
        `${chalk.red(this.formatTime(elapsed))}`
    )
    console.log(`  ${chalk.red('→')} ${error}`)

    this.currentTask = null
  }

  formatTime(ms) {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  summary() {
    const totalElapsed = Date.now() - this.startTime
    console.log(`\n${chalk.bold('Test Summary')}`)
    console.log(chalk.gray('─'.repeat(50)))
    console.log(
      `${chalk.green('Completed:')} ${this.completedTasks.length} tasks`
    )
    console.log(`${chalk.red('Failed:')} ${this.failedTasks.length} tasks`)
    console.log(`${chalk.blue('Total time:')} ${this.formatTime(totalElapsed)}`)

    if (this.failedTasks.length > 0) {
      console.log(`\n${chalk.red('Failed Tasks:')}`)
      this.failedTasks.forEach((task) => {
        console.log(`  - ${task.name}: ${task.error}`)
      })
    }

    return {
      completed: this.completedTasks.length,
      failed: this.failedTasks.length,
      totalTime: totalElapsed,
      tasks: [...this.completedTasks, ...this.failedTasks],
    }
  }

  log(message, level = 'info') {
    // Temporarily clear the progress line
    if (this.currentTask && this.spinnerInterval) {
      process.stdout.write('\r\x1b[K')
    }

    // Log the message
    switch (level) {
      case 'error':
        console.log(chalk.red(`  ✗ ${message}`))
        break
      case 'warning':
        console.log(chalk.yellow(`  ⚠ ${message}`))
        break
      case 'success':
        console.log(chalk.green(`  ✓ ${message}`))
        break
      default:
        console.log(chalk.gray(`  ℹ ${message}`))
    }

    // Resume progress display
    if (this.currentTask && this.spinnerInterval) {
      this.updateProgress()
    }
  }
}

module.exports = ProgressTracker
