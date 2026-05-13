-- Add FK constraints for data integrity

-- tsk_task_dependency: FK to tsk_task
ALTER TABLE tsk_task_dependency
    ADD CONSTRAINT fk_task_dep_task_id
        FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_task_dep_depends_on
        FOREIGN KEY (depends_on_task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

-- wf_business_object: FK to sys_user (applicant) and prj_project
ALTER TABLE wf_business_object
    ADD CONSTRAINT fk_bo_applicant
        FOREIGN KEY (applicant_id) REFERENCES sys_user(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_bo_project
        FOREIGN KEY (project_id) REFERENCES prj_project(id) ON DELETE SET NULL;
