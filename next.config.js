module.exports = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Forçar renderização dinâmica para evitar erros de pré-renderização no servidor
    dynamicParams: true,
}
