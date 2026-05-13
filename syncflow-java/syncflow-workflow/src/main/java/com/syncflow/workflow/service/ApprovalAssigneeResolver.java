package com.syncflow.workflow.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.workflow.entity.ApprovalConfig;
import com.syncflow.workflow.mapper.ApprovalConfigMapper;
import com.syncflow.workflow.mapper.CrossModuleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.expression.BeanFactoryResolver;
import org.springframework.expression.Expression;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.expression.spel.support.StandardTypeConverter;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Resolves approval assignees for a given BPMN node based on
 * {@link ApprovalConfig} rules.
 * <p>
 * Supported rule types:
 * <ul>
 *   <li>{@code PROJECT_ROLE} — query project members by role via {@link CrossModuleMapper}</li>
 *   <li>{@code USER} — parse comma-separated user ids</li>
 *   <li>{@code DEPARTMENT} — find department head or members via {@link CrossModuleMapper}</li>
 *   <li>{@code DYNAMIC} — evaluate a SpEL expression with {@code @bean} references and context variables</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalAssigneeResolver implements ApplicationContextAware {

    private static final SpelExpressionParser SPEL_PARSER = new SpelExpressionParser();

    private final ApprovalConfigMapper approvalConfigMapper;
    private final CrossModuleMapper crossModuleMapper;

    private ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    /**
     * Resolve the list of user ids who should be assigned to a specific BPMN
     * approval node.
     *
     * @param objectType  business object type
     * @param processKey  Flowable process-definition key
     * @param nodeId      BPMN node id
     * @param projectId   owning project id (used for PROJECT_ROLE resolution)
     * @param applicantId the applicant user id (used for certain rules)
     * @return list of resolved user ids, empty if no config found
     */
    public List<Long> resolveAssignees(String objectType, String processKey,
                                       String nodeId, Long projectId, Long applicantId) {

        ApprovalConfig config = approvalConfigMapper.selectOne(
                new LambdaQueryWrapper<ApprovalConfig>()
                        .eq(ApprovalConfig::getObjectType, objectType)
                        .eq(ApprovalConfig::getProcessKey, processKey)
                        .eq(ApprovalConfig::getNodeId, nodeId)
                        .eq(ApprovalConfig::getEnabled, true)
                        .orderByAsc(ApprovalConfig::getPriority)
                        .last("LIMIT 1")
        );

        if (config == null) {
            log.warn("No approval config found for objectType={}, processKey={}, nodeId={}",
                    objectType, processKey, nodeId);
            return Collections.emptyList();
        }

        return switch (config.getRuleType()) {
            case "PROJECT_ROLE" -> resolveByProjectRole(config.getRuleValue(), projectId);
            case "USER" -> resolveByUserIds(config.getRuleValue());
            case "DEPARTMENT" -> resolveByDepartment(config.getRuleValue(), applicantId);
            case "DYNAMIC" -> resolveByExpression(config.getExpression(), projectId, applicantId);
            default -> {
                log.warn("Unknown ruleType: {}", config.getRuleType());
                yield Collections.emptyList();
            }
        };
    }

    // -----------------------------------------------------------------------
    //  Private resolution strategies
    // -----------------------------------------------------------------------

    /**
     * Resolve by project role — queries {@code prj_project_member} to find
     * users with the given role in the specified project.
     */
    private List<Long> resolveByProjectRole(String roleCode, Long projectId) {
        log.info("Resolving assignees by project role [{}] for project {}", roleCode, projectId);
        if (projectId == null) {
            log.warn("Cannot resolve by project role: projectId is null");
            return Collections.emptyList();
        }
        try {
            List<Long> userIds = crossModuleMapper.selectUsersByProjectRole(projectId, roleCode);
            log.info("Resolved {} assignee(s) for project role [{}] in project {}",
                    userIds.size(), roleCode, projectId);
            return userIds;
        } catch (Exception e) {
            log.error("Failed to resolve assignees by project role [{}] for project {}: {}",
                    roleCode, projectId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Resolve by explicit user ids (comma-separated).
     */
    private List<Long> resolveByUserIds(String userIds) {
        if (userIds == null || userIds.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(userIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }

    /**
     * Resolve by department — the ruleValue may be either a department id
     * (look up all users in that department) or "APPLICANT_DEPT" (look up
     * the applicant's department head).
     */
    private List<Long> resolveByDepartment(String departmentRuleValue, Long applicantId) {
        log.info("Resolving assignees by department [{}] for applicant {}", departmentRuleValue, applicantId);

        if (departmentRuleValue == null || departmentRuleValue.isBlank()) {
            return Collections.emptyList();
        }

        try {
            if ("APPLICANT_DEPT".equalsIgnoreCase(departmentRuleValue)) {
                // Find the department head of the applicant's department
                Long deptHead = crossModuleMapper.selectDepartmentHead(applicantId);
                if (deptHead != null) {
                    return List.of(deptHead);
                }
                log.warn("No department head found for applicant {}", applicantId);
                return Collections.emptyList();
            } else {
                // Treat as a department id and find all active users in that department
                Long deptId = Long.parseLong(departmentRuleValue.trim());
                List<Long> userIds = crossModuleMapper.selectUsersByDepartment(deptId);
                log.info("Resolved {} assignee(s) for department {}", userIds.size(), deptId);
                return userIds;
            }
        } catch (NumberFormatException e) {
            log.error("Invalid department rule value: {}", departmentRuleValue);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to resolve assignees by department [{}]: {}", departmentRuleValue, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Resolve by dynamic SpEL expression.
     * <p>
     * Evaluates the expression against a {@link StandardEvaluationContext} that:
     * <ul>
     *   <li>Resolves {@code @beanName} references via {@link BeanFactoryResolver}</li>
     *   <li>Exposes {@code #projectId} and {@code #applicantId} as context variables</li>
     *   <li>Supports automatic type conversion (e.g. single Long → singleton list)</li>
     * </ul>
     */
    private List<Long> resolveByExpression(String expression, Long projectId, Long applicantId) {
        log.info("Resolving assignees by expression [{}] for applicant {}", expression, applicantId);

        if (expression == null || expression.isBlank()) {
            log.warn("SpEL expression is null or blank");
            return Collections.emptyList();
        }

        try {
            StandardEvaluationContext context = new StandardEvaluationContext();
            context.setBeanResolver(new BeanFactoryResolver(applicationContext));
            context.setVariable("projectId", projectId);
            context.setVariable("applicantId", applicantId);
            context.setTypeConverter(new StandardTypeConverter());

            Expression parsed = SPEL_PARSER.parseExpression(expression);
            Object result = parsed.getValue(context);

            return toLongList(result);
        } catch (Exception e) {
            log.error("Failed to evaluate SpEL expression [{}]: {}", expression, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Normalize an expression result to {@code List<Long>}.
     * Accepts {@code null}, {@code Long}, {@code List<Long>}, or any
     * {@code Collection<Long>}.
     */
    @SuppressWarnings("unchecked")
    private List<Long> toLongList(Object value) {
        if (value == null) {
            return Collections.emptyList();
        }
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(Long.class::isInstance)
                    .map(Long.class::cast)
                    .collect(Collectors.toList());
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream()
                    .filter(Long.class::isInstance)
                    .map(Long.class::cast)
                    .collect(Collectors.toList());
        }
        if (value instanceof Long l) {
            return List.of(l);
        }
        log.warn("Unexpected SpEL result type: {}", value.getClass().getName());
        return Collections.emptyList();
    }
}
