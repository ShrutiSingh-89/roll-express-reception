package com.familyrestaurant.reception.api;

import org.springframework.http.HttpStatus;

public class ApiProblem extends RuntimeException {
    private final HttpStatus status;

    public ApiProblem(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
