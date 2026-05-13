import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HoverContextMenu from './index';

describe('HoverContextMenu', () => {
  it('renders menu items when visible', async () => {
    render(
      <HoverContextMenu nodeType="root" nodeId="n1" onAction={vi.fn()} hoverDelay={0}>
        <span>tree-node</span>
      </HoverContextMenu>,
    );

    // Hover to trigger menu
    const wrapper = screen.getByTestId('hover-menu-wrapper-n1');
    await act(async () => {
      fireEvent.mouseEnter(wrapper);
    });

    // Menu should appear immediately (delay=0)
    const menu = await screen.findByTestId('hover-menu-n1');
    expect(menu).toBeTruthy();

    // Root node has 2 items
    expect(screen.getByTestId('menu-item-new-folder')).toBeTruthy();
    expect(screen.getByTestId('menu-item-new-project')).toBeTruthy();
  });

  it('menu appears after specified delay', async () => {
    vi.useFakeTimers();

    render(
      <HoverContextMenu nodeType="project" nodeId="p1" onAction={vi.fn()} hoverDelay={500}>
        <span>tree-node</span>
      </HoverContextMenu>,
    );

    const wrapper = screen.getByTestId('hover-menu-wrapper-p1');
    fireEvent.mouseEnter(wrapper);

    // Menu should NOT be visible immediately
    expect(screen.queryByTestId('hover-menu-p1')).toBeNull();

    // Advance time past the delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now menu should be visible
    expect(screen.getByTestId('hover-menu-p1')).toBeTruthy();

    // Project node items present
    expect(screen.getByTestId('menu-item-new-task')).toBeTruthy();
    expect(screen.getByTestId('menu-item-set-participants')).toBeTruthy();

    vi.useRealTimers();
  });

  it('menu item click triggers callback with correct args', async () => {
    const onAction = vi.fn();

    render(
      <HoverContextMenu nodeType="task" nodeId="t42" onAction={onAction} hoverDelay={0}>
        <span>tree-node</span>
      </HoverContextMenu>,
    );

    const wrapper = screen.getByTestId('hover-menu-wrapper-t42');
    await act(async () => {
      fireEvent.mouseEnter(wrapper);
    });

    const editItem = await screen.findByTestId('menu-item-edit');
    fireEvent.click(editItem);

    expect(onAction).toHaveBeenCalledWith('t42', 'edit');
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
