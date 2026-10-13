package com.familyrestaurant.reception.service;

import com.familyrestaurant.reception.api.ApiProblem;
import com.familyrestaurant.reception.api.BillRequest;
import com.familyrestaurant.reception.api.BillView;
import com.familyrestaurant.reception.model.Bill;
import com.familyrestaurant.reception.model.BillItem;
import com.familyrestaurant.reception.model.MenuItem;
import com.familyrestaurant.reception.repository.BillRepository;
import com.familyrestaurant.reception.repository.MenuItemRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillService {
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private final BillRepository bills;
    private final MenuItemRepository menu;

    public BillService(BillRepository bills, MenuItemRepository menu) {
        this.bills = bills;
        this.menu = menu;
    }

    @Transactional(readOnly = true)
    public List<BillView> list() {
        return bills.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(BillView::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillView get(long id) {
        return BillView.from(find(id));
    }

    @Transactional
    public BillView create(BillRequest request) {
        Bill bill = new Bill();
        bill.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        bill.setCustomerName(trimToNull(request.customerName));
        bill.setTableNumber(null);
        bill.setServiceType(Bill.ServiceType.TAKEAWAY);
        bill.setStatus(Bill.Status.UNPAID);

        BigDecimal subtotal = BigDecimal.ZERO.setScale(2);
        Set<Long> seen = new HashSet<>();
        for (BillRequest.Line input : request.items) {
            if (!seen.add(input.menuItemId)) {
                throw new ApiProblem(HttpStatus.BAD_REQUEST, "Each menu item can appear only once per bill");
            }
            MenuItem item = menu.findById(input.menuItemId)
                    .orElseThrow(() -> new ApiProblem(HttpStatus.BAD_REQUEST,
                            "Menu item " + input.menuItemId + " does not exist"));
            if (!item.isAvailable()) {
                throw new ApiProblem(HttpStatus.BAD_REQUEST, item.getName() + " is unavailable");
            }
            BillItem line = new BillItem(item.getId(), item.getName(), item.getPrice(), input.quantity);
            bill.getItems().add(line);
            subtotal = subtotal.add(line.getLineTotal());
        }

        BigDecimal discountPercent = defaultZero(request.discountPercent);
        BigDecimal discountAmount = percentOf(subtotal, discountPercent);
        BigDecimal discountedTotal = subtotal.subtract(discountAmount);
        bill.setSubtotal(subtotal);
        bill.setDiscountPercent(discountPercent);
        bill.setDiscountAmount(discountAmount);
        bill.setTaxPercent(BigDecimal.ZERO.setScale(2));
        bill.setTaxAmount(BigDecimal.ZERO.setScale(2));
        bill.setTotal(discountedTotal);

        bills.saveAndFlush(bill);
        bill.setBillNumber(String.format("RE-%06d", bill.getId()));
        return BillView.from(bills.save(bill));
    }

    @Transactional
    public BillView pay(long id, Bill.PaymentMethod method) {
        Bill bill = find(id);
        if (bill.getStatus() == Bill.Status.PAID) {
            throw new ApiProblem(HttpStatus.CONFLICT, "Bill is already paid");
        }
        bill.setPaymentMethod(method);
        bill.setPaidAt(OffsetDateTime.now(ZoneOffset.UTC));
        bill.setStatus(Bill.Status.PAID);
        return BillView.from(bills.save(bill));
    }

    private Bill find(long id) {
        return bills.findById(id)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Bill not found"));
    }

    private static BigDecimal percentOf(BigDecimal base, BigDecimal percent) {
        return base.multiply(percent).divide(HUNDRED, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal defaultZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
    }
}
