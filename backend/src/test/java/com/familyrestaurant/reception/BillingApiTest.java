package com.familyrestaurant.reception;

import com.jayway.jsonpath.JsonPath;
import com.familyrestaurant.reception.model.MenuItem;
import com.familyrestaurant.reception.model.SeedState;
import com.familyrestaurant.reception.repository.MenuItemRepository;
import com.familyrestaurant.reception.repository.SeedStateRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BillingApiTest {
    @Autowired MockMvc mvc;
    @Autowired MenuItemRepository menu;
    @Autowired SeedStateRepository seedState;
    @Autowired @Qualifier("seedMenu") CommandLineRunner seedMenu;

    @Test
    void createsBillWithServerPricesAndMarksItPaid() throws Exception {
        MenuItem item = menu.save(new MenuItem("Test Roll", "Test", new BigDecimal("99.00"), true));
        String billJson = "{\"serviceType\":\"DINE_IN\",\"tableNumber\":\"4\",\"items\":[{\"menuItemId\":"
                + item.getId() + ",\"quantity\":2}],\"discountPercent\":10,\"taxPercent\":5}";

        String body = mvc.perform(post("/api/bills").contentType(MediaType.APPLICATION_JSON).content(billJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.billNumber").isNotEmpty())
                .andExpect(jsonPath("$.status").value("UNPAID"))
                .andExpect(jsonPath("$.serviceType").value("TAKEAWAY"))
                .andExpect(jsonPath("$.tableNumber").isEmpty())
                .andExpect(jsonPath("$.subtotal").value(198.00))
                .andExpect(jsonPath("$.discountAmount").value(19.80))
                .andExpect(jsonPath("$.taxPercent").value(0.00))
                .andExpect(jsonPath("$.taxAmount").value(0.00))
                .andExpect(jsonPath("$.total").value(178.20))
                .andReturn().getResponse().getContentAsString();

        Integer id = JsonPath.read(body, "$.id");
        item.setPrice(new BigDecimal("109.00"));
        menu.save(item);
        mvc.perform(get("/api/bills/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].unitPrice").value(99.00));
        mvc.perform(post("/api/bills/" + id + "/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethod\":\"UPI\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.paymentMethod").value("UPI"));
    }

    @Test
    void createsTakeawayBillWithoutLegacyFields() throws Exception {
        MenuItem item = menu.save(new MenuItem("Takeaway Test Roll", "Test", new BigDecimal("75.00"), true));
        String billJson = "{\"items\":[{\"menuItemId\":" + item.getId() + ",\"quantity\":1}]}";
        mvc.perform(post("/api/bills").contentType(MediaType.APPLICATION_JSON).content(billJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.serviceType").value("TAKEAWAY"))
                .andExpect(jsonPath("$.tableNumber").isEmpty())
                .andExpect(jsonPath("$.taxAmount").value(0.00))
                .andExpect(jsonPath("$.total").value(75.00));
    }

    @Test
    void rejectsUnusableItemsAndInvalidQuantity() throws Exception {
        MenuItem unavailable = menu.save(new MenuItem("Unavailable", "Test", new BigDecimal("10.00"), false));
        String unavailableBill = "{\"serviceType\":\"DINE_IN\",\"items\":[{\"menuItemId\":"
                + unavailable.getId() + ",\"quantity\":1}]}";
        mvc.perform(post("/api/bills").contentType(MediaType.APPLICATION_JSON).content(unavailableBill))
                .andExpect(status().isBadRequest());
        String invalidQuantity = "{\"serviceType\":\"DINE_IN\",\"items\":[{\"menuItemId\":"
                + unavailable.getId() + ",\"quantity\":0}]}";
        mvc.perform(post("/api/bills").contentType(MediaType.APPLICATION_JSON).content(invalidQuantity))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void migratesUntouchedDemoMenuAndDoesNotReseedAfterDeletion() throws Exception {
        menu.deleteAll();
        seedState.deleteAll();
        menu.saveAll(List.of(
                new MenuItem("Classic Veg Roll", "Veg Rolls", new BigDecimal("149.00"), true),
                new MenuItem("Paneer Tikka Roll", "Veg Rolls", new BigDecimal("199.00"), true),
                new MenuItem("Cheese Corn Roll", "Veg Rolls", new BigDecimal("179.00"), true),
                new MenuItem("Egg Roll", "Non-Veg Rolls", new BigDecimal("169.00"), true),
                new MenuItem("Chicken Tikka Roll", "Non-Veg Rolls", new BigDecimal("229.00"), true),
                new MenuItem("Peri Peri Fries", "Sides", new BigDecimal("129.00"), true),
                new MenuItem("Masala Fries", "Sides", new BigDecimal("119.00"), true),
                new MenuItem("Fresh Lime Soda", "Drinks", new BigDecimal("79.00"), true),
                new MenuItem("Cold Coffee", "Drinks", new BigDecimal("119.00"), true)
        ));
        MenuItem custom = menu.save(new MenuItem("Staff Special", "Custom", new BigDecimal("42.00"), true));
        seedState.save(new SeedState("demo-menu-v1"));

        seedMenu.run();
        assertTrue(seedState.existsById("photo-roll-menu-v1"));
        assertEquals(45, menu.count()); // 44 photo rolls plus the staff's custom item.
        assertTrue(menu.existsById(custom.getId()));
        assertFalse(menu.findAll().stream().anyMatch(item -> item.getName().equals("Cold Coffee")));
        assertTrue(menu.findAll().stream().anyMatch(item -> item.getName().equals("Veg Roll")
                && item.getPrice().compareTo(new BigDecimal("100.00")) == 0));
        assertTrue(menu.findAll().stream().anyMatch(item -> item.getName().equals("Egg Roll")
                && item.getPrice().compareTo(new BigDecimal("80.00")) == 0));

        menu.deleteAll();
        seedMenu.run();
        assertEquals(0, menu.count());
    }
}
