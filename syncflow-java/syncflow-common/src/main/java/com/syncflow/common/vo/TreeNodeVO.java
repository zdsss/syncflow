package com.syncflow.common.vo;

import lombok.Data;

import java.util.List;

@Data
public class TreeNodeVO {

    private String id;
    private String name;
    private String type;
    private String icon;
    private List<TreeNodeVO> children;
    private Integer progress;
    private String status;
}
