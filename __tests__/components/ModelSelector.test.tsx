import { render, screen, fireEvent } from '@testing-library/react'
import { ModelSelector } from '@/components/ModelSelector'

describe('ModelSelector', () => {
  const mockOnModelChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render model selector', () => {
    render(<ModelSelector selectedModel="claude-haiku-4-5-20251001" onModelChange={mockOnModelChange} />)

    expect(screen.getByText(/claude haiku/i)).toBeInTheDocument()
  })

  it('should display currently selected model', () => {
    render(<ModelSelector selectedModel="claude-haiku-4-5-20251001" onModelChange={mockOnModelChange} />)

    const selector = screen.getByRole('combobox')
    expect(selector).toHaveTextContent(/claude haiku/i)
  })

  it('should call onModelChange when model is selected', () => {
    render(<ModelSelector selectedModel="claude-haiku-4-5-20251001" onModelChange={mockOnModelChange} />)

    const selector = screen.getByRole('combobox')
    fireEvent.click(selector)

    // Look for another model option
    const opusOption = screen.getByText(/opus/i)
    fireEvent.click(opusOption)

    expect(mockOnModelChange).toHaveBeenCalled()
  })

  it('should show all available models when opened', () => {
    render(<ModelSelector selectedModel="claude-haiku-4-5-20251001" onModelChange={mockOnModelChange} />)

    const selector = screen.getByRole('combobox')
    fireEvent.click(selector)

    expect(screen.getByText(/haiku/i)).toBeInTheDocument()
    expect(screen.getByText(/opus/i)).toBeInTheDocument()
  })
})
