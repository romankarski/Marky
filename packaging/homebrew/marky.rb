class Marky < Formula
  desc "Local-first markdown workspace for browsing and editing notes"
  homepage "https://github.com/romankarski/Marky"
  version "0.1.1"
  url "https://github.com/romankarski/Marky/releases/download/v0.1.1/marky-0.1.1.tgz"
  sha256 "4b1f27c07817d578d9a06d5a66968a4512f2a75e79622bec3d603f472cbf0c61"
  license "MIT"

  depends_on "node"

  def install
    cache_dir = buildpath/".npm-cache"

    cd "package" do
      system Formula["node"].opt_bin/"npm", "install", "--omit=dev", "--cache", cache_dir
    end

    libexec.install "package"

    (bin/"marky").write <<~SH
      #!/bin/bash
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/package/server/dist/cli.js" "$@"
    SH
  end

  test do
    (testpath/"note.md").write("# hello from homebrew\n")
    output = shell_output("#{bin}/marky --no-open #{testpath} 2>&1", 1)
    assert_match "http://127.0.0.1:", output
  end
end
