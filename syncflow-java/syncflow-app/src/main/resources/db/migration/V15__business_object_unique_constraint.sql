-- Prevent duplicate approval workflows for the same business object.
-- A given (object_type, object_id) pair should only have one active (status=2) workflow at a time.
-- The unique index covers all statuses so we can detect duplicates before inserting.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_business_object_type_id_status
    ON wf_business_object(object_type, object_id, status)
    WHERE status IN (1, 2); -- draft or pending_approval only; completed/rejected/withdrawn can repeat
