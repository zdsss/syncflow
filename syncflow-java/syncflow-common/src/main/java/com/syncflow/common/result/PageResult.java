package com.syncflow.common.result;

import com.baomidou.mybatisplus.core.metadata.IPage;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * Paginated response wrapper.
 * <p>
 * Bridges MyBatis-Plus {@link IPage} into a clean JSON shape:
 * <pre>
 * {
 *   "records": [ ... ],
 *   "total": 42,
 *   "size": 10,
 *   "current": 1
 * }
 * </pre>
 *
 * @param <T> element type
 */
public class PageResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /** Records on the current page. */
    private List<T> records;

    /** Total number of records across all pages. */
    private long total;

    /** Page size (number of records per page). */
    private long size;

    /** Current page number (1-based). */
    private long current;

    public PageResult() {
        this.records = Collections.emptyList();
    }

    public PageResult(List<T> records, long total, long size, long current) {
        this.records = records;
        this.total = total;
        this.size = size;
        this.current = current;
    }

    /**
     * Build a {@code PageResult} directly from a MyBatis-Plus {@link IPage}.
     *
     * @param page the page returned by MyBatis-Plus
     * @param <T>  record type
     * @return a new {@code PageResult}
     */
    public static <T> PageResult<T> of(IPage<T> page) {
        return new PageResult<>(
                page.getRecords(),
                page.getTotal(),
                page.getSize(),
                page.getCurrent()
        );
    }

    /**
     * Empty page with zero totals.
     */
    public static <T> PageResult<T> empty() {
        return new PageResult<>(Collections.emptyList(), 0, 0, 1);
    }

    // -----------------------------------------------------------------------
    //  Getters / Setters
    // -----------------------------------------------------------------------

    public List<T> getRecords() {
        return records;
    }

    public void setRecords(List<T> records) {
        this.records = records;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public long getCurrent() {
        return current;
    }

    public void setCurrent(long current) {
        this.current = current;
    }
}
