package com.familyrestaurant.reception.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "seed_state")
public class SeedState {
    @Id
    @Column(length = 50)
    private String id;

    protected SeedState() {}

    public SeedState(String id) { this.id = id; }

    public String getId() { return id; }
}
