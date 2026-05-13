package com.syncflow;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@ComponentScan(basePackages = "com.syncflow")
@MapperScan("com.syncflow.**.mapper")
@EnableCaching(proxyTargetClass = true)
@EnableAsync
public class SyncFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(SyncFlowApplication.class, args);
    }
}
