package br.com.urbanrisk.service.privacy;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PrivacyGuardTest {

    private final PrivacyGuard guard = new PrivacyGuard("salt");

    @Test
    void pseudonymizeIsStableButDoesNotExposeId() {
        String h1 = guard.pseudonymize("device-123");
        assertThat(h1).hasSize(64).doesNotContain("device-123").isEqualTo(guard.pseudonymize(" DEVICE-123 "));
        assertThat(new PrivacyGuard("outro").pseudonymize("device-123")).isNotEqualTo(h1);
        assertThat(guard.pseudonymize(null)).isNull();
    }

    @Test
    void coordinatesAreCoarsenedToAbout110Meters() {
        assertThat(guard.coarsen(-23.550512)).isEqualTo(-23.551);
    }

    @Test
    void redactsPersonalDataFromFreeText() {
        String out = guard.redact("Rua alagada, me liga (11) 98765-4321 ou joao@mail.com, CPF 123.456.789-09");
        assertThat(out).doesNotContain("98765").doesNotContain("joao@").doesNotContain("123.456")
                .contains("[telefone removido]").contains("[e-mail removido]").contains("[documento removido]");
    }
}
