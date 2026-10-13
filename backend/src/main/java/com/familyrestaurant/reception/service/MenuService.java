package com.familyrestaurant.reception.service;

import com.familyrestaurant.reception.api.ApiProblem;
import com.familyrestaurant.reception.api.MenuItemRequest;
import com.familyrestaurant.reception.model.MenuItem;
import com.familyrestaurant.reception.repository.MenuItemRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MenuService {
    private final MenuItemRepository repository;

    public MenuService(MenuItemRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<MenuItem> list() {
        return repository.findAllByOrderByCategoryAscNameAsc();
    }

    @Transactional
    public MenuItem create(MenuItemRequest request) {
        MenuItem item = new MenuItem(
                request.name.trim(), request.category.trim(), request.price,
                request.available == null || request.available);
        return repository.save(item);
    }

    @Transactional
    public MenuItem update(long id, MenuItemRequest request) {
        MenuItem item = repository.findById(id)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Menu item not found"));
        item.setName(request.name.trim());
        item.setCategory(request.category.trim());
        item.setPrice(request.price);
        item.setAvailable(request.available == null || request.available);
        return repository.save(item);
    }

    @Transactional
    public void delete(long id) {
        if (!repository.existsById(id)) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Menu item not found");
        }
        repository.deleteById(id);
    }
}
