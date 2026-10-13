package com.familyrestaurant.reception.api;

import com.familyrestaurant.reception.service.BillService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bills")
public class BillController {
    private final BillService service;

    public BillController(BillService service) {
        this.service = service;
    }

    @GetMapping
    public List<BillView> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public BillView get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<BillView> create(@Valid @RequestBody BillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PostMapping("/{id}/pay")
    public BillView pay(@PathVariable long id, @Valid @RequestBody PaymentRequest request) {
        return service.pay(id, request.paymentMethod);
    }
}
