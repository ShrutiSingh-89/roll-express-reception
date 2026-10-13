package com.familyrestaurant.reception.repository;

import com.familyrestaurant.reception.model.MenuItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findAllByOrderByCategoryAscNameAsc();
}
