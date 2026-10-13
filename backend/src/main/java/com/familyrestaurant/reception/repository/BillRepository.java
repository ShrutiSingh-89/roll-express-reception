package com.familyrestaurant.reception.repository;

import com.familyrestaurant.reception.model.Bill;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findAllByOrderByCreatedAtDescIdDesc();
}
